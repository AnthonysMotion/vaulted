import { db } from "@/db";
import {
  activityFeed,
  cards,
  collections,
  packOpenings,
  profiles,
  sets,
  userAchievements,
  userCards,
  type FeedPayload,
  type Profile,
} from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { openPack } from "@/lib/packs/engine";
import { packConfigForSet } from "@/lib/packs/configs";
import { companionSetIdsFor } from "@/lib/packs/companions";
import { isFallbackEnergyId } from "@/lib/packs/basic-energy";
import {
  FEED_WORTHY_TIER,
  ULTRA_RARE_TIER,
  isSecretTier,
  levelForXp,
  xpForTier,
} from "@/lib/packs/rarity";
import type { OpenedPack } from "@/lib/packs/types";
import { DAILY_PACK_LIMIT } from "@/lib/game/constants";

export { DAILY_PACK_LIMIT };
const XP_PER_PACK = 25;

export class PackLimitError extends Error {
  constructor() {
    super("Daily pack limit reached");
    this.name = "PackLimitError";
  }
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function utcYesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function loadSetForOpening(setId: string) {
  const set = await db.query.sets.findFirst({ where: eq(sets.id, setId) });
  if (!set) throw new Error(`Unknown set: ${setId}`);

  // Code configs are the source of truth (era layouts + set overrides).
  const config = packConfigForSet(set.id, set.series);
  const companionIds = config.companionSetIds ?? companionSetIdsFor(setId);
  const poolSetIds = [setId, ...companionIds];

  const setCards = await db.query.cards.findMany({
    where:
      poolSetIds.length === 1
        ? eq(cards.setId, setId)
        : inArray(cards.setId, poolSetIds),
  });
  if (setCards.length === 0) throw new Error(`Set ${setId} has no cards`);

  return { set, setCards, config };
}

/** Sandbox mode: pure simulation, nothing persisted. */
export async function openSandboxPack(setId: string): Promise<OpenedPack> {
  const { setCards, config } = await loadSetForOpening(setId);
  return openPack(setCards, config);
}

export type TrainerOpenResult = {
  pack: OpenedPack;
  xpAwarded: number;
  newLevel: number;
  leveledUp: boolean;
  streak: number;
  packsRemainingToday: number;
  newAchievements: { id: string; name: string; icon: string }[];
  newCardIds: string[];
  completedSet: boolean;
};

/**
 * Trainer mode: enforces the daily limit, persists cards to the collection,
 * updates streak/XP/achievements and emits feed events.
 */
export async function openTrainerPack(
  profile: Profile,
  setId: string,
): Promise<TrainerOpenResult> {
  const today = utcToday();
  const yesterday = utcYesterday();
  const { set, setCards, config } = await loadSetForOpening(setId);

  // Validate the set before consuming a daily slot so bad data/config cannot
  // burn one of the trainer's limited packs for the day.
  // Atomically claim a pack slot for today (guards concurrent requests).
  const claimed = await db
    .update(profiles)
    .set({
      packsOpenedToday: sql`CASE WHEN ${profiles.lastPackDate} = ${today} THEN ${profiles.packsOpenedToday} + 1 ELSE 1 END`,
      currentStreak: sql`CASE
        WHEN ${profiles.lastPackDate} = ${today} THEN ${profiles.currentStreak}
        WHEN ${profiles.lastPackDate} = ${yesterday} THEN ${profiles.currentStreak} + 1
        ELSE 1 END`,
      lastPackDate: today,
      totalPacksOpened: sql`${profiles.totalPacksOpened} + 1`,
    })
    .where(
      and(
        eq(profiles.id, profile.id),
        sql`(${profiles.lastPackDate} IS DISTINCT FROM ${today} OR ${profiles.packsOpenedToday} < ${DAILY_PACK_LIMIT})`,
      ),
    )
    .returning();

  if (claimed.length === 0) throw new PackLimitError();
  const updated = claimed[0];
  const pack = openPack(setCards, config);

  // --- Persist pulled cards -------------------------------------------------
  // Fallback Basic Energy is display-only (not in the cards table).
  const collectibleCards = pack.cards.filter((p) => !isFallbackEnergyId(p.card.id));
  const newCardIds: string[] = [];
  const countsByCard = new Map<string, number>();
  for (const pulled of collectibleCards) {
    countsByCard.set(pulled.card.id, (countsByCard.get(pulled.card.id) ?? 0) + 1);
  }

  for (const [cardId, count] of countsByCard) {
    const res = await db
      .insert(userCards)
      .values({ userId: profile.id, cardId, quantity: count })
      .onConflictDoUpdate({
        target: [userCards.userId, userCards.cardId],
        set: { quantity: sql`${userCards.quantity} + ${count}` },
      })
      .returning({ quantity: userCards.quantity });
    if (res[0]?.quantity === count) newCardIds.push(cardId);
  }

  // --- Set completion progress ----------------------------------------------
  let completedSet = false;
  if (newCardIds.length > 0) {
    const [progress] = await db
      .insert(collections)
      .values({ userId: profile.id, setId, uniqueOwned: newCardIds.length })
      .onConflictDoUpdate({
        target: [collections.userId, collections.setId],
        set: { uniqueOwned: sql`${collections.uniqueOwned} + ${newCardIds.length}` },
      })
      .returning();

    if (progress.uniqueOwned >= set.total && !progress.completedAt) {
      completedSet = true;
      await db
        .update(collections)
        .set({ completedAt: new Date() })
        .where(eq(collections.id, progress.id));
    }
  }

  // --- XP / level -------------------------------------------------------------
  const rarityXp = collectibleCards.reduce((sum, c) => sum + xpForTier(c.rarityTier), 0);
  const streakBonus = Math.min(updated.currentStreak, 30);
  const xpAwarded = XP_PER_PACK + rarityXp + streakBonus + (pack.isGodPack ? 500 : 0);

  const bestPull =
    collectibleCards.length > 0
      ? collectibleCards.reduce((a, b) => (b.rarityTier > a.rarityTier ? b : a))
      : null;
  const packTotalXp = updated.xp + xpAwarded;
  const packLevel = levelForXp(packTotalXp);

  // Same filter as persistence: fallback Basic Energy is display-only.
  const collectibleCount = collectibleCards.length;

  // --- Achievements --------------------------------------------------------------
  const achievementResult = await checkAchievements(profile.id, {
    totalPacks: updated.totalPacksOpened,
    totalCards: updated.totalCardsCollected + collectibleCount,
    streak: updated.currentStreak,
    level: packLevel,
    bestTier: bestPull?.rarityTier ?? 0,
    pulledSecret: collectibleCards.some((c) => isSecretTier(c.card.rarity)),
    pulledUltra: collectibleCards.some((c) => c.rarityTier >= ULTRA_RARE_TIER),
    completedSet,
    godPack: pack.isGodPack,
  });

  const newTotalXp = packTotalXp + achievementResult.bonusXp;
  const newLevel = levelForXp(newTotalXp);
  const leveledUp = newLevel > updated.level;

  await db
    .update(profiles)
    .set({
      xp: newTotalXp,
      level: newLevel,
      totalCardsCollected: sql`${profiles.totalCardsCollected} + ${collectibleCount}`,
      longestStreak: sql`GREATEST(${profiles.longestStreak}, ${updated.currentStreak})`,
      ...(bestPull && bestPull.rarityTier > updated.rarestPullScore
        ? { rarestPullCardId: bestPull.card.id, rarestPullScore: bestPull.rarityTier }
        : {}),
    })
    .where(eq(profiles.id, profile.id));

  // --- Feed events -------------------------------------------------------------
  const feedEvents: { type: typeof activityFeed.$inferInsert.type; payload: FeedPayload }[] = [];
  if (bestPull && bestPull.rarityTier >= FEED_WORTHY_TIER) {
    feedEvents.push({
      type: "rare_pull",
      payload: {
        cardId: bestPull.card.id,
        cardName: bestPull.card.name,
        cardImage: bestPull.card.imageSmall ?? undefined,
        rarity: bestPull.card.rarity ?? undefined,
        setId,
        setName: set.name,
      },
    });
  }
  if (completedSet) {
    feedEvents.push({ type: "set_completed", payload: { setId, setName: set.name } });
  }
  if (leveledUp) {
    feedEvents.push({ type: "level_up", payload: { level: newLevel } });
  }
  if ([7, 14, 30, 50, 100, 365].includes(updated.currentStreak)) {
    feedEvents.push({
      type: "streak_milestone",
      payload: { streak: updated.currentStreak },
    });
  }
  if (feedEvents.length > 0) {
    await db
      .insert(activityFeed)
      .values(feedEvents.map((e) => ({ userId: profile.id, ...e })));
  }

  // --- Record the opening ----------------------------------------------------------
  await db.insert(packOpenings).values({
    userId: profile.id,
    setId,
    cards: pack.cards.map((c) => ({
      cardId: c.card.id,
      rarity: c.card.rarity,
      reverseHolo: c.reverseHolo,
    })),
    isGodPack: pack.isGodPack,
    xpAwarded,
  });

  return {
    pack,
    xpAwarded,
    newLevel,
    leveledUp,
    streak: updated.currentStreak,
    packsRemainingToday: Math.max(0, DAILY_PACK_LIMIT - updated.packsOpenedToday),
    newAchievements: achievementResult.unlocked,
    newCardIds,
    completedSet,
  };
}

type AchievementContext = {
  totalPacks: number;
  totalCards: number;
  streak: number;
  level: number;
  bestTier: number;
  pulledSecret: boolean;
  pulledUltra: boolean;
  completedSet: boolean;
  godPack: boolean;
};

async function checkAchievements(userId: string, ctx: AchievementContext) {
  const candidates: string[] = [];
  if (ctx.totalPacks >= 1) candidates.push("first-pack");
  if (ctx.totalPacks >= 10) candidates.push("packs-10");
  if (ctx.totalPacks >= 100) candidates.push("packs-100");
  if (ctx.totalPacks >= 500) candidates.push("packs-500");
  if (ctx.pulledUltra) candidates.push("first-ultra-rare");
  if (ctx.pulledSecret) candidates.push("first-secret-rare");
  if (ctx.godPack) candidates.push("god-pack");
  if (ctx.totalCards >= 100) candidates.push("cards-100");
  if (ctx.totalCards >= 1000) candidates.push("cards-1000");
  if (ctx.completedSet) candidates.push("first-set-complete");
  if (ctx.streak >= 7) candidates.push("streak-7");
  if (ctx.streak >= 30) candidates.push("streak-30");
  if (ctx.streak >= 365) candidates.push("streak-365");
  if (ctx.level >= 10) candidates.push("level-10");
  if (ctx.level >= 50) candidates.push("level-50");

  if (candidates.length === 0) {
    return { unlocked: [], bonusXp: 0 };
  }

  const inserted = await db
    .insert(userAchievements)
    .values(candidates.map((achievementId) => ({ userId, achievementId })))
    .onConflictDoNothing()
    .returning({ achievementId: userAchievements.achievementId });

  if (inserted.length === 0) {
    return { unlocked: [], bonusXp: 0 };
  }

  const defs = await db.query.achievements.findMany();
  const defById = new Map(defs.map((d) => [d.id, d]));
  const unlocked = inserted
    .map((i) => defById.get(i.achievementId))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));

  // Award achievement XP + feed events.
  const bonusXp = unlocked.reduce((sum, d) => sum + d.xpReward, 0);
  if (bonusXp > 0) {
    await db
      .update(profiles)
      .set({ xp: sql`${profiles.xp} + ${bonusXp}` })
      .where(eq(profiles.id, userId));
  }
  if (unlocked.length > 0) {
    await db.insert(activityFeed).values(
      unlocked.map((d) => ({
        userId,
        type: "achievement" as const,
        payload: { achievementId: d.id, achievementName: `${d.icon} ${d.name}` },
      })),
    );
  }

  return {
    unlocked: unlocked.map((d) => ({ id: d.id, name: d.name, icon: d.icon })),
    bonusXp,
  };
}

/** Serialisable card payload sent to the client after opening. */
export function serialisePack(pack: OpenedPack) {
  return {
    setId: pack.setId,
    isGodPack: pack.isGodPack,
    cards: pack.cards.map((p) => ({
      id: p.card.id,
      name: p.card.name,
      rarity: p.card.rarity,
      imageSmall: p.card.imageSmall,
      imageLarge: p.card.imageLarge,
      number: p.card.number,
      types: p.card.types,
      supertype: p.card.supertype,
      reverseHolo: p.reverseHolo,
      slotName: p.slotName,
      rarityTier: p.rarityTier,
    })),
  };
}

export type SerialisedPack = ReturnType<typeof serialisePack>;
export type SerialisedPulledCard = SerialisedPack["cards"][number];

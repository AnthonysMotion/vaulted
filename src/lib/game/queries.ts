import { db } from "@/db";
import {
  activityFeed,
  binders,
  cards,
  collections,
  friendships,
  packOpenings,
  profiles,
  sets,
  userCards,
} from "@/db/schema";
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { rarityTier } from "@/lib/packs/rarity";

export async function getProfileByUsername(username: string) {
  return db.query.profiles.findFirst({
    where: eq(profiles.username, username.toLowerCase()),
    with: {
      favouriteCard: { with: { set: true } },
      rarestPull: true,
    },
  });
}

export async function getAllSets() {
  return db.query.sets.findMany({ orderBy: [desc(sets.releaseDate)] });
}

export async function getSetById(setId: string) {
  return db.query.sets.findFirst({ where: eq(sets.id, setId) });
}

export async function getCardsForSet(setId: string) {
  return db.query.cards.findMany({
    where: eq(cards.setId, setId),
    columns: {
      id: true,
      name: true,
      number: true,
      rarity: true,
      imageSmall: true,
      imageLarge: true,
    },
    orderBy: [asc(cards.number), asc(cards.name)],
  });
}

export async function getOwnedCardCountsForSet(userId: string, setId: string) {
  return db
    .select({
      cardId: userCards.cardId,
      quantity: userCards.quantity,
    })
    .from(userCards)
    .innerJoin(cards, eq(userCards.cardId, cards.id))
    .where(and(eq(userCards.userId, userId), eq(cards.setId, setId)));
}

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------

export type CollectionFilters = {
  setId?: string;
  rarity?: string;
  type?: string;
  search?: string;
  page?: number;
};

const PAGE_SIZE = 60;

export async function getUserCollection(userId: string, filters: CollectionFilters) {
  const conditions = [eq(userCards.userId, userId)];
  if (filters.setId) conditions.push(eq(cards.setId, filters.setId));
  if (filters.rarity) conditions.push(eq(cards.rarity, filters.rarity));
  if (filters.type) conditions.push(sql`${cards.types} @> ${JSON.stringify([filters.type])}`);
  if (filters.search) conditions.push(ilike(cards.name, `%${filters.search}%`));

  const page = Math.max(1, filters.page ?? 1);

  const rows = await db
    .select({
      cardId: userCards.cardId,
      quantity: userCards.quantity,
      firstObtainedAt: userCards.firstObtainedAt,
      card: {
        id: cards.id,
        name: cards.name,
        number: cards.number,
        rarity: cards.rarity,
        imageSmall: cards.imageSmall,
        imageLarge: cards.imageLarge,
      },
    })
    .from(userCards)
    .innerJoin(cards, eq(userCards.cardId, cards.id))
    .where(and(...conditions))
    .orderBy(desc(userCards.firstObtainedAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const [{ total }] = await db
    .select({ total: count() })
    .from(userCards)
    .innerJoin(cards, eq(userCards.cardId, cards.id))
    .where(and(...conditions));

  return { rows, total, page, pageSize: PAGE_SIZE };
}

export async function getCollectionSummary(userId: string) {
  const [rarityRows, [totals]] = await Promise.all([
    db
      .select({ rarity: cards.rarity, unique: count(), copies: sql<number>`sum(${userCards.quantity})::int` })
      .from(userCards)
      .innerJoin(cards, eq(userCards.cardId, cards.id))
      .where(eq(userCards.userId, userId))
      .groupBy(cards.rarity),
    db
      .select({
        unique: count(),
        copies: sql<number>`coalesce(sum(${userCards.quantity}), 0)::int`,
      })
      .from(userCards)
      .where(eq(userCards.userId, userId)),
  ]);

  return { rarityDistribution: rarityRows, ...totals };
}

/** Total cards pulled from trainer packs (sum of each opening's card count). */
export async function getCardsCollectedFromPacks(userId: string) {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(jsonb_array_length(${packOpenings.cards})), 0)::int`,
    })
    .from(packOpenings)
    .where(eq(packOpenings.userId, userId));
  return row?.total ?? 0;
}

/** Per-set owned counts joined with set totals for completion percentages. */
export async function getSetProgress(userId: string) {
  return db
    .select({
      set: sets,
      uniqueOwned: collections.uniqueOwned,
      completedAt: collections.completedAt,
    })
    .from(collections)
    .innerJoin(sets, eq(collections.setId, sets.id))
    .where(eq(collections.userId, userId))
    .orderBy(desc(sql`${collections.uniqueOwned}::float / ${sets.total}`));
}

// ---------------------------------------------------------------------------
// Binder
// ---------------------------------------------------------------------------

export async function getBinder(userId: string) {
  return db.query.binders.findFirst({
    where: eq(binders.userId, userId),
    with: { slots: { with: { card: true } } },
  });
}

// ---------------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------------

export async function getFriendships(userId: string) {
  const rows = await db.query.friendships.findMany({
    where: or(
      eq(friendships.requesterId, userId),
      eq(friendships.addresseeId, userId),
    ),
    with: {
      requester: { columns: { id: true, username: true, avatarUrl: true, level: true } },
      addressee: { columns: { id: true, username: true, avatarUrl: true, level: true } },
    },
    orderBy: [desc(friendships.createdAt)],
  });

  const friends = rows
    .filter((r) => r.status === "accepted")
    .map((r) => ({
      friendshipId: r.id,
      friend: r.requesterId === userId ? r.addressee : r.requester,
    }));
  const incoming = rows.filter((r) => r.status === "pending" && r.addresseeId === userId);
  const outgoing = rows.filter((r) => r.status === "pending" && r.requesterId === userId);

  return { friends, incoming, outgoing };
}

export async function areFriends(userIdA: string, userIdB: string) {
  const row = await db.query.friendships.findFirst({
    where: and(
      eq(friendships.status, "accepted"),
      or(
        and(eq(friendships.requesterId, userIdA), eq(friendships.addresseeId, userIdB)),
        and(eq(friendships.requesterId, userIdB), eq(friendships.addresseeId, userIdA)),
      ),
    ),
  });
  return Boolean(row);
}

// ---------------------------------------------------------------------------
// Collection comparison
// ---------------------------------------------------------------------------

export async function compareCollections(
  myUserId: string,
  theirUserId: string,
  setId: string,
) {
  const setCards = await db.query.cards.findMany({
    where: eq(cards.setId, setId),
    columns: { id: true, name: true, rarity: true, number: true, imageSmall: true },
  });
  const ids = setCards.map((c) => c.id);
  if (ids.length === 0) return null;

  const [mine, theirs] = await Promise.all([
    db.query.userCards.findMany({
      where: and(eq(userCards.userId, myUserId), inArray(userCards.cardId, ids)),
      columns: { cardId: true },
    }),
    db.query.userCards.findMany({
      where: and(eq(userCards.userId, theirUserId), inArray(userCards.cardId, ids)),
      columns: { cardId: true },
    }),
  ]);

  const mySet = new Set(mine.map((m) => m.cardId));
  const theirSet = new Set(theirs.map((t) => t.cardId));

  return {
    totalCards: ids.length,
    myOwned: mySet.size,
    theirOwned: theirSet.size,
    myMissing: setCards.filter((c) => !mySet.has(c.id)),
    theirMissing: setCards.filter((c) => !theirSet.has(c.id)),
    /** Cards I have that they're missing — trade bait. */
    iHaveTheyNeed: setCards.filter((c) => mySet.has(c.id) && !theirSet.has(c.id)),
  };
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

export async function getGlobalFeed(limit = 40) {
  return db.query.activityFeed.findMany({
    orderBy: [desc(activityFeed.createdAt)],
    limit,
    with: {
      user: { columns: { id: true, username: true, avatarUrl: true, level: true } },
      reactions: true,
    },
  });
}

export type FeedItemWithRelations = Awaited<ReturnType<typeof getGlobalFeed>>[number];

// ---------------------------------------------------------------------------
// Profile activity (recent pack openings)
// ---------------------------------------------------------------------------

export async function getUserRecentPackOpenings(userId: string, limit = 12) {
  const openings = await db.query.packOpenings.findMany({
    where: eq(packOpenings.userId, userId),
    orderBy: [desc(packOpenings.openedAt)],
    limit,
    with: { set: true },
  });

  const cardIds = [
    ...new Set(openings.flatMap((o) => o.cards.map((c) => c.cardId))),
  ];
  const cardRows =
    cardIds.length > 0
      ? await db.query.cards.findMany({
          where: inArray(cards.id, cardIds),
          columns: {
            id: true,
            name: true,
            rarity: true,
            imageSmall: true,
          },
        })
      : [];
  const byId = new Map(cardRows.map((c) => [c.id, c]));

  return openings.map((opening) => {
    const enriched = opening.cards
      .map((c) => {
        const card = byId.get(c.cardId) ?? null;
        return {
          cardId: c.cardId,
          rarity: c.rarity,
          reverseHolo: Boolean(c.reverseHolo),
          tier: rarityTier(c.rarity),
          card,
        };
      })
      .sort((a, b) => b.tier - a.tier || a.cardId.localeCompare(b.cardId));

    return {
      id: opening.id,
      openedAt: opening.openedAt,
      isGodPack: opening.isGodPack,
      xpAwarded: opening.xpAwarded,
      set: opening.set,
      cardCount: opening.cards.length,
      highlights: enriched.filter((c) => c.card).slice(0, 4),
      bestTier: enriched[0]?.tier ?? 0,
    };
  });
}

export type ProfilePackOpening = Awaited<
  ReturnType<typeof getUserRecentPackOpenings>
>[number];

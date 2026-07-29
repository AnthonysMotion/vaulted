import type { Card } from "@/db/schema";
import { rarityTier } from "./rarity";
import type {
  OpenedPack,
  PackConfig,
  PulledCard,
  Rng,
  SlotConfig,
} from "./types";

/**
 * Data-driven booster pack simulator.
 *
 * Given a set's full card pool and its PackConfig, produces a pack that
 * respects the configured slot structure and researched rarity weights.
 * Outcomes whose rarity pools don't exist in the set are dropped and their
 * weight is effectively redistributed among the remaining outcomes, so a
 * single era config safely covers sets with slightly different line-ups.
 */
export class PackEngine {
  private pools = new Map<string, Card[]>();

  constructor(
    private readonly setCards: Card[],
    private readonly config: PackConfig,
  ) {
    for (const card of setCards) {
      const key = card.rarity ?? "Common";
      const pool = this.pools.get(key);
      if (pool) pool.push(card);
      else this.pools.set(key, [card]);
    }
  }

  open(rng: Rng = Math.random): OpenedPack {
    const setId = this.setCards[0]?.setId ?? "";

    if (this.config.godPack && rng() < this.config.godPack.chance) {
      const godPool = this.resolvePool(this.config.godPack.rarities);
      if (godPool.length > 0) {
        const cards = this.drawMany(godPool, this.config.cardsPerPack, rng).map(
          (card): PulledCard => ({
            card,
            reverseHolo: false,
            slotName: "God Pack",
            rarityTier: rarityTier(card.rarity),
          }),
        );
        return { setId, cards, isGodPack: true };
      }
    }

    const cards: PulledCard[] = [];
    for (const slot of this.config.slots) {
      for (let i = 0; i < slot.count; i++) {
        const pulled = this.drawSlot(slot, cards, rng);
        if (pulled) cards.push(pulled);
      }
    }
    return { setId, cards, isGodPack: false };
  }

  /** Weighted-pick a viable outcome, then draw a card from its pool. */
  private drawSlot(
    slot: SlotConfig,
    alreadyPulled: PulledCard[],
    rng: Rng,
  ): PulledCard | null {
    const viable = slot.outcomes
      .map((outcome) => ({ outcome, pool: this.resolvePool(outcome.rarities) }))
      .filter((v) => v.pool.length > 0);

    if (viable.length === 0) {
      // Set has none of the configured rarities at all (tiny promo sets).
      const anyPool = this.setCards;
      if (anyPool.length === 0) return null;
      const card = this.drawOne(anyPool, alreadyPulled, rng);
      return {
        card,
        reverseHolo: false,
        slotName: slot.name,
        rarityTier: rarityTier(card.rarity),
      };
    }

    const picked = weightedPick(viable, (v) => v.outcome.weight, rng);
    const card = this.drawOne(picked.pool, alreadyPulled, rng);
    return {
      card,
      reverseHolo: picked.outcome.reverseHolo ?? false,
      slotName: picked.outcome.label ?? slot.name,
      rarityTier: rarityTier(card.rarity),
    };
  }

  /** Union pool for rarities, applying configured then generic fallbacks. */
  private resolvePool(rarities: string[]): Card[] {
    const direct = rarities.flatMap((r) => this.pools.get(r) ?? []);
    if (direct.length > 0) return direct;

    const fallbacks = this.config.rarityFallbacks ?? {};
    for (const rarity of rarities) {
      for (const fb of fallbacks[rarity] ?? []) {
        const pool = this.pools.get(fb);
        if (pool && pool.length > 0) return pool;
      }
    }
    return [];
  }

  /** Uniform draw, avoiding in-pack duplicates when the pool allows it. */
  private drawOne(pool: Card[], alreadyPulled: PulledCard[], rng: Rng): Card {
    const pulledIds = new Set(alreadyPulled.map((p) => p.card.id));
    const fresh = pool.filter((c) => !pulledIds.has(c.id));
    const source = fresh.length > 0 ? fresh : pool;
    return source[Math.floor(rng() * source.length)];
  }

  private drawMany(pool: Card[], count: number, rng: Rng): Card[] {
    const result: Card[] = [];
    const remaining = [...pool];
    for (let i = 0; i < count; i++) {
      if (remaining.length === 0) {
        result.push(pool[Math.floor(rng() * pool.length)]);
        continue;
      }
      const idx = Math.floor(rng() * remaining.length);
      result.push(remaining[idx]);
      remaining.splice(idx, 1);
    }
    return result;
  }
}

function weightedPick<T>(items: T[], weightOf: (item: T) => number, rng: Rng): T {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= weightOf(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

export function openPack(
  setCards: Card[],
  config: PackConfig,
  rng: Rng = Math.random,
): OpenedPack {
  return new PackEngine(setCards, config).open(rng);
}

// ---------------------------------------------------------------------------
// Simulation (internal testing tool)
// ---------------------------------------------------------------------------

export type SimulationResult = {
  packs: number;
  godPacks: number;
  /** Per-rarity: packs containing at least one card of that rarity. */
  rarityPackRate: Record<string, { count: number; percent: number; oneIn: number }>;
  /** Top individual cards by pull count. */
  topCards: { cardId: string; name: string; rarity: string | null; count: number; percent: number }[];
  totalCardsDrawn: number;
};

export function simulatePacks(
  setCards: Card[],
  config: PackConfig,
  packCount: number,
  rng: Rng = Math.random,
): SimulationResult {
  const engine = new PackEngine(setCards, config);
  const rarityPacks = new Map<string, number>();
  const cardCounts = new Map<string, number>();
  let godPacks = 0;
  let totalCards = 0;

  for (let i = 0; i < packCount; i++) {
    const pack = engine.open(rng);
    if (pack.isGodPack) godPacks++;
    const raritiesInPack = new Set<string>();
    for (const pulled of pack.cards) {
      totalCards++;
      raritiesInPack.add(pulled.card.rarity ?? "Unknown");
      cardCounts.set(pulled.card.id, (cardCounts.get(pulled.card.id) ?? 0) + 1);
    }
    for (const rarity of raritiesInPack) {
      rarityPacks.set(rarity, (rarityPacks.get(rarity) ?? 0) + 1);
    }
  }

  const cardById = new Map(setCards.map((c) => [c.id, c]));
  const rarityPackRate: SimulationResult["rarityPackRate"] = {};
  for (const [rarity, count] of [...rarityPacks.entries()].sort(
    (a, b) => rarityTier(b[0]) - rarityTier(a[0]),
  )) {
    rarityPackRate[rarity] = {
      count,
      percent: (count / packCount) * 100,
      oneIn: count > 0 ? packCount / count : Infinity,
    };
  }

  const topCards = [...cardCounts.entries()]
    .map(([cardId, count]) => {
      const card = cardById.get(cardId);
      return {
        cardId,
        name: card?.name ?? cardId,
        rarity: card?.rarity ?? null,
        count,
        percent: (count / packCount) * 100,
      };
    })
    .sort((a, b) => rarityTier(b.rarity) - rarityTier(a.rarity) || b.count - a.count)
    .slice(0, 40);

  return {
    packs: packCount,
    godPacks,
    rarityPackRate,
    topCards,
    totalCardsDrawn: totalCards,
  };
}

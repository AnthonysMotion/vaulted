import type { Card } from "@/db/schema";
import { createFallbackBasicEnergies } from "./basic-energy";
import { rarityTier } from "./rarity";
import type {
  OpenedPack,
  PackConfig,
  PulledCard,
  Rng,
  SlotConfig,
  SlotOutcome,
} from "./types";

/** Basic Energy eligible for Energy slots (excludes chase foil Energy). */
const CHASE_ENERGY_RARITIES = new Set([
  "Rare Secret",
  "Rare Ultra",
  "Hyper Rare",
  "Ultra Rare",
  "Rare Rainbow",
  "ACE SPEC Rare",
  "Rare Holo",
]);

function isEnergy(card: Card): boolean {
  return card.supertype === "Energy";
}

function isBasicEnergy(card: Card): boolean {
  if (!isEnergy(card)) return false;
  const subtypes = card.subtypes ?? [];
  return subtypes.includes("Basic");
}

function isPackBasicEnergy(card: Card): boolean {
  if (!isBasicEnergy(card)) return false;
  const rarity = card.rarity ?? "Common";
  return !CHASE_ENERGY_RARITIES.has(rarity);
}

/**
 * Data-driven booster pack simulator.
 *
 * Packs are built slot-by-slot from an era layout. Each slot only draws from
 * its allowed rarity pool (never "any card from the set"). Energy cards are
 * excluded from non-Energy slots; Illustration Rares / galleries only appear
 * where the slot outcomes allow them.
 */
export class PackEngine {
  /** Non-Energy cards bucketed by rarity string. */
  private pools = new Map<string, Card[]>();
  /** Basic Energy eligible for Energy slots. */
  private basicEnergy: Card[] = [];
  /** All cards by setId (for companion / gallery filters). */
  private bySetId = new Map<string, Card[]>();

  constructor(
    private readonly setCards: Card[],
    private readonly config: PackConfig,
  ) {
    const primarySetId = setCards[0]?.setId ?? "unknown";

    for (const card of setCards) {
      const setPool = this.bySetId.get(card.setId);
      if (setPool) setPool.push(card);
      else this.bySetId.set(card.setId, [card]);

      if (isPackBasicEnergy(card)) {
        this.basicEnergy.push(card);
        continue;
      }
      if (isEnergy(card)) continue;

      const key = card.rarity ?? "Common";
      const pool = this.pools.get(key);
      if (pool) pool.push(card);
      else this.pools.set(key, [card]);
    }

    // SWSH/SV checklists usually omit pack Basic Energy (or only list chase
    // foil prints). Inject shared commons so Energy slots still resolve.
    if (this.basicEnergy.length === 0) {
      this.basicEnergy = createFallbackBasicEnergies(primarySetId);
    }
  }

  open(rng: Rng = Math.random): OpenedPack {
    const setId = this.setCards[0]?.setId ?? "";

    if (this.config.godPack && rng() < this.config.godPack.chance) {
      const godPool = this.resolvePool({
        weight: 1,
        rarities: this.config.godPack.rarities,
      });
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
      .map((outcome) => ({ outcome, pool: this.resolvePool(outcome) }))
      .filter((v) => v.pool.length > 0);

    if (viable.length === 0) {
      const anyPool = [...this.pools.values()].flat();
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

  /** Union pool for an outcome, applying set filters and rarity fallbacks. */
  private resolvePool(outcome: SlotOutcome): Card[] {
    if (outcome.energyOnly) return this.basicEnergy;

    let pool: Card[];
    if (outcome.fromSetIds && outcome.fromSetIds.length > 0) {
      pool = outcome.fromSetIds.flatMap((id) => this.bySetId.get(id) ?? []);
      if (outcome.rarities.length > 0) {
        const allowed = new Set(outcome.rarities);
        const filtered = pool.filter((c) => allowed.has(c.rarity ?? "Common"));
        if (filtered.length > 0) pool = filtered;
      }
      return pool.filter((c) => !isEnergy(c) || isPackBasicEnergy(c));
    }

    pool = outcome.rarities.flatMap((r) => this.pools.get(r) ?? []);
    if (pool.length > 0) return pool;

    const fallbacks = this.config.rarityFallbacks ?? {};
    for (const rarity of outcome.rarities) {
      for (const fb of fallbacks[rarity] ?? []) {
        const fbPool = this.pools.get(fb);
        if (fbPool && fbPool.length > 0) return fbPool;
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

  /**
   * P(a single draw from `slot` yields a card of `rarity`), matching resolvePool
   * + weighted outcomes (independent of in-pack duplicate avoidance).
   */
  private pSlotYieldsRarity(slot: SlotConfig, rarity: string): number {
    const viable = slot.outcomes
      .map((outcome) => ({ outcome, pool: this.resolvePool(outcome) }))
      .filter((v) => v.pool.length > 0);
    if (viable.length === 0) return 0;

    const totalW = viable.reduce((sum, v) => sum + v.outcome.weight, 0);
    let p = 0;
    for (const { outcome, pool } of viable) {
      const matching = pool.filter((c) => (c.rarity ?? "Unknown") === rarity).length;
      p += (outcome.weight / totalW) * (matching / pool.length);
    }
    return p;
  }

  /**
   * Expected share of packs containing ≥1 card of each rarity, from the
   * configured slot weights + this set's card pools (incl. god packs).
   */
  expectedRarityPackRates(): Record<string, { percent: number; oneIn: number }> {
    const rarities = new Set<string>([...this.pools.keys()]);
    if (this.basicEnergy.length > 0) {
      for (const c of this.basicEnergy) rarities.add(c.rarity ?? "Common");
    }

    const g = this.config.godPack?.chance ?? 0;
    const godPool = this.config.godPack
      ? this.resolvePool({ weight: 1, rarities: this.config.godPack.rarities })
      : [];

    const out: Record<string, { percent: number; oneIn: number }> = {};
    for (const rarity of rarities) {
      let pNone = 1;
      for (const slot of this.config.slots) {
        const p = this.pSlotYieldsRarity(slot, rarity);
        pNone *= (1 - p) ** slot.count;
      }
      const pNormal = 1 - pNone;

      let pGod = 0;
      if (godPool.length > 0) {
        const share =
          godPool.filter((c) => (c.rarity ?? "Unknown") === rarity).length /
          godPool.length;
        pGod = 1 - (1 - share) ** this.config.cardsPerPack;
      }

      const p = (1 - g) * pNormal + g * pGod;
      out[rarity] = {
        percent: p * 100,
        oneIn: p > 0 ? 1 / p : Infinity,
      };
    }
    return out;
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

export type RarityAccuracy = {
  rarity: string;
  observedPercent: number;
  observedOneIn: number;
  targetPercent: number;
  targetOneIn: number;
  /** Observed − target, in percentage points. */
  deltaPp: number;
  /** |obs−target| / target (0–1+). */
  relativeError: number;
  /** Approximate 95% SE of the observed rate (percentage points). */
  samplingSePp: number;
  /** True when |delta| is within ~2× sampling SE. */
  withinNoise: boolean;
  grade: "excellent" | "good" | "fair" | "off";
};

export type AccuracySummary = {
  /** Mean relative error across graded rarities (0–1). */
  meanRelativeError: number;
  /** Share of graded rarities within sampling noise. */
  withinNoiseShare: number;
  gradedCount: number;
  grade: "excellent" | "good" | "fair" | "off";
  rows: RarityAccuracy[];
};

function gradeRelativeError(rel: number): RarityAccuracy["grade"] {
  if (rel < 0.02) return "excellent";
  if (rel < 0.05) return "good";
  if (rel < 0.12) return "fair";
  return "off";
}

/**
 * Compare simulated pack rates to config-implied targets for this set's pools.
 * Skips rarities with tiny targets (<0.05%). Too noisy to grade usefully.
 */
export function compareSimulationAccuracy(
  result: SimulationResult,
  expected: Record<string, { percent: number; oneIn: number }>,
): AccuracySummary {
  const n = result.packs;
  const rows: RarityAccuracy[] = [];

  const rarities = new Set([
    ...Object.keys(result.rarityPackRate),
    ...Object.keys(expected),
  ]);

  for (const rarity of [...rarities].sort(
    (a, b) => rarityTier(b) - rarityTier(a),
  )) {
    const obs = result.rarityPackRate[rarity];
    const exp = expected[rarity];
    if (!exp || exp.percent < 0.05) continue;

    const observedPercent = obs?.percent ?? 0;
    const p = exp.percent / 100;
    const samplingSePp = Math.sqrt((p * (1 - p)) / Math.max(n, 1)) * 100;
    const deltaPp = observedPercent - exp.percent;
    const relativeError =
      exp.percent > 0 ? Math.abs(deltaPp) / exp.percent : 0;
    const withinNoise = Math.abs(deltaPp) <= 2 * samplingSePp + 1e-9;

    rows.push({
      rarity,
      observedPercent,
      observedOneIn: obs?.oneIn ?? Infinity,
      targetPercent: exp.percent,
      targetOneIn: exp.oneIn,
      deltaPp,
      relativeError,
      samplingSePp,
      withinNoise,
      grade: gradeRelativeError(relativeError),
    });
  }

  const meanRelativeError =
    rows.length > 0
      ? rows.reduce((s, r) => s + r.relativeError, 0) / rows.length
      : 0;
  const withinNoiseShare =
    rows.length > 0
      ? rows.filter((r) => r.withinNoise).length / rows.length
      : 1;

  return {
    meanRelativeError,
    withinNoiseShare,
    gradedCount: rows.length,
    grade: gradeRelativeError(meanRelativeError),
    rows,
  };
}

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

/** Simulate and attach accuracy vs config-implied targets. */
export function simulatePacksWithAccuracy(
  setCards: Card[],
  config: PackConfig,
  packCount: number,
  rng: Rng = Math.random,
) {
  const result = simulatePacks(setCards, config, packCount, rng);
  const expected = new PackEngine(setCards, config).expectedRarityPackRates();
  const accuracy = compareSimulationAccuracy(result, expected);
  return { result, expected, accuracy };
}

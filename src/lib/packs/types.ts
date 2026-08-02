import type { Card } from "@/db/schema";

/**
 * A weighted outcome for a single pack slot. When the slot resolves, one
 * outcome is chosen by weight, then a card is drawn uniformly from the set's
 * cards matching `rarities` (with fallbacks if the set lacks that rarity).
 */
export type SlotOutcome = {
  /** Relative weight among sibling outcomes (any positive scale). */
  weight: number;
  /** Card rarities (pokemon-tcg-data strings) eligible for this outcome. */
  rarities: string[];
  /** Render/record the card as a reverse holo variant. */
  reverseHolo?: boolean;
  /** Human-readable label, e.g. "Illustration Rare". */
  label?: string;
  /**
   * Draw only Basic Energy cards (Energy slot). Ignores rarity buckets
   * except to exclude chase foil Energy prints.
   */
  energyOnly?: boolean;
  /**
   * Restrict draws to cards whose `setId` is in this list. Used for
   * Trainer Gallery / Galarian Gallery companion pools merged into a pack.
   */
  fromSetIds?: string[];
};

export type SlotConfig = {
  /** Display name, e.g. "Common", "Reverse Slot 1", "Rare Slot". */
  name: string;
  /** Number of cards drawn from this slot. */
  count: number;
  outcomes: SlotOutcome[];
};

export type GodPackConfig = {
  /** Per-pack probability (0-1) that every card comes from `rarities`. */
  chance: number;
  rarities: string[];
};

export type PackConfig = {
  era: string;
  cardsPerPack: number;
  slots: SlotConfig[];
  godPack?: GodPackConfig;
  /**
   * When a set has no cards of a requested rarity, try these instead
   * (checked in order). A final generic fallback also applies.
   */
  rarityFallbacks?: Record<string, string[]>;
  /**
   * Companion set IDs whose cards are merged into the pack pool
   * (Trainer Gallery, Galarian Gallery, Shiny Vault, etc.).
   */
  companionSetIds?: string[];
  /** Provenance for the numbers used. */
  sourceNotes: string;
};

export type PulledCard = {
  card: Card;
  reverseHolo: boolean;
  slotName: string;
  /** 0 (common) .. 6 (chase). Drives glow + "rarest pull" ranking. */
  rarityTier: number;
};

export type OpenedPack = {
  setId: string;
  cards: PulledCard[];
  isGodPack: boolean;
};

/** Deterministic-friendly RNG signature (returns [0, 1)). */
export type Rng = () => number;

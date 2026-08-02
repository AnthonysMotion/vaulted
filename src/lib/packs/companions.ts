/**
 * pokemon-tcg-data stores Trainer Gallery / Galarian Gallery / Shiny Vault
 * subsets as separate set files. Pack opening merges these into the parent
 * booster so reverse-slot upgrades can actually resolve.
 */
export const COMPANION_SETS: Record<string, string[]> = {
  /** Hidden Fates → Shiny Vault */
  sm115: ["sma"],
  /** Shining Fates → Shiny Vault */
  swsh45: ["swsh45sv"],
  /** Brilliant Stars → Trainer Gallery */
  swsh9: ["swsh9tg"],
  /** Astral Radiance → Trainer Gallery */
  swsh10: ["swsh10tg"],
  /** Lost Origin → Trainer Gallery */
  swsh11: ["swsh11tg"],
  /** Silver Tempest → Trainer Gallery */
  swsh12: ["swsh12tg"],
  /** Crown Zenith → Galarian Gallery */
  swsh12pt5: ["swsh12pt5gg"],
};

/** Sets that are gallery/vault companions and should not be opened alone. */
export const COMPANION_ONLY_SET_IDS = new Set(
  Object.values(COMPANION_SETS).flat(),
);

export function companionSetIdsFor(setId: string): string[] {
  return COMPANION_SETS[setId] ?? [];
}

/**
 * Rarity tiers across every era, used for glow effects, "rarest pull"
 * ranking, feed events and XP bonuses. Higher = rarer.
 *
 * Tier guide:
 * 0 Common | 1 Uncommon | 2 Rare | 3 Holo / Double Rare tier
 * 4 Ultra Rare tier | 5 Illustration / secret-adjacent | 6 Chase (SIR/Hyper/Gold Star)
 */
const RARITY_TIERS: Record<string, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  "Rare Holo": 3,
  "Double Rare": 3,
  "Rare BREAK": 3,
  "Rare Prism Star": 3,
  "Radiant Rare": 4,
  "Amazing Rare": 4,
  "Rare ACE": 4,
  "ACE SPEC Rare": 4,
  "Rare Holo EX": 4,
  "Rare Holo GX": 4,
  "Rare Holo V": 3,
  "Rare Holo LV.X": 4,
  "Rare Prime": 4,
  "Rare Holo VMAX": 4,
  "Rare Holo VSTAR": 4,
  "Ultra Rare": 4,
  "Rare Ultra": 4,
  LEGEND: 5,
  "Rare Shining": 5,
  "Rare Shiny": 5,
  "Shiny Rare": 5,
  "Illustration Rare": 5,
  "Trainer Gallery Rare Holo": 5,
  "Rare Shiny GX": 5,
  "Shiny Ultra Rare": 6,
  "Mega Hyper Rare": 6,
  MEGA_ATTACK_RARE: 4,
  "Rare Secret": 6,
  "Rare Rainbow": 6,
  "Special Illustration Rare": 6,
  "Hyper Rare": 6,
  "Rare Holo Star": 6,
};

export function rarityTier(rarity: string | null | undefined): number {
  if (!rarity) return 0;
  return RARITY_TIERS[rarity] ?? 2;
}

/** Badge color token for a rarity tier (safe for server + client). */
export function rarityBadgeColor(tier: number) {
  if (tier >= 6) return "pink" as const;
  if (tier >= 5) return "gold" as const;
  if (tier >= 4) return "purple" as const;
  if (tier >= 3) return "blue" as const;
  return "default" as const;
}

/** Tier at which a pull is feed-worthy ("X pulled ...!"). */
export const FEED_WORTHY_TIER = 4;

/** Tier at which a pack counts as containing an "ultra rare or better". */
export const ULTRA_RARE_TIER = 4;

export function isSecretTier(rarity: string | null | undefined): boolean {
  return rarityTier(rarity) >= 6;
}

export function xpForTier(tier: number): number {
  const bonus = [0, 2, 5, 15, 40, 80, 150];
  return bonus[Math.min(tier, bonus.length - 1)] ?? 0;
}

/** Total XP needed to reach a level (quadratic curve, level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) * level;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

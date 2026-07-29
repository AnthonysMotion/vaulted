import type { PackConfig } from "./types";

/**
 * Researched pull-rate configurations.
 *
 * The Pokémon Company does not publish English pull rates, so these numbers
 * come from the largest public community datasets:
 *
 * - TCGplayer Infinite pull-rate studies (95% confidence intervals over
 *   thousands of authenticated packs) for SWSH/SV era sets.
 * - Elite Fourum "Pull Rates in Sun & Moon - Sword & Shield Sets" (burpies),
 *   multi-thousand pack samples per era.
 * - ThePriceDex per-set pull-rate models (community data aggregation).
 * - Long-standing community consensus for vintage ratios (e.g. WotC 1:3 holo).
 *
 * Weights inside a slot are relative percentages. The engine only considers
 * outcomes whose rarity pools exist in the target set, so one era config
 * safely covers sets with slightly different rarity line-ups (fallbacks and
 * outcome filtering handle the rest).
 */

const REVERSE_POOL = ["Common", "Uncommon", "Rare", "Rare Holo"];

/** WotC & early vintage: Base, Jungle, Fossil, Gym, Neo, e-Card. */
const VINTAGE: PackConfig = {
  era: "vintage",
  cardsPerPack: 11,
  slots: [
    { name: "Common", count: 7, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 3, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Rare",
      count: 1,
      outcomes: [
        { weight: 66.7, rarities: ["Rare"] },
        { weight: 30, rarities: ["Rare Holo"], label: "Holo Rare" },
        { weight: 3.3, rarities: ["Rare Shining", "Rare Secret"], label: "Shining / Secret" },
      ],
    },
  ],
  rarityFallbacks: {
    "Rare Holo": ["Rare"],
    "Rare Shining": ["Rare Holo", "Rare"],
    "Rare Secret": ["Rare Holo", "Rare"],
  },
  sourceNotes:
    "WotC era: 11-card packs (7C/3U/1R). Holo rare ~1:3 packs is long-standing community consensus; Shining Pokémon (Neo Destiny) ~1:30 packs.",
};

/** EX era: Ruby & Sapphire through Power Keepers. */
const EX_ERA: PackConfig = {
  era: "ex",
  cardsPerPack: 9,
  slots: [
    { name: "Common", count: 5, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 2, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Reverse Holo",
      count: 1,
      outcomes: [{ weight: 100, rarities: REVERSE_POOL, reverseHolo: true }],
    },
    {
      name: "Rare",
      count: 1,
      outcomes: [
        { weight: 61, rarities: ["Rare"] },
        { weight: 29, rarities: ["Rare Holo"], label: "Holo Rare" },
        { weight: 8.3, rarities: ["Rare Holo EX"], label: "Pokémon ex" },
        { weight: 1.4, rarities: ["Rare Holo Star", "Rare Ultra", "Rare Secret"], label: "Gold Star / Secret" },
      ],
    },
  ],
  rarityFallbacks: {
    "Rare Holo EX": ["Rare Holo"],
    "Rare Holo Star": ["Rare Holo EX", "Rare Holo"],
    "Rare Ultra": ["Rare Holo EX", "Rare Holo"],
    "Rare Secret": ["Rare Holo"],
  },
  sourceNotes:
    "EX era: 9-card packs with reverse slot. Holo ~1:3, Pokémon ex ~1:12, Gold Star ~1:72 (≈1 per 2 boxes) per community consensus (Flipside Gaming rarity review, collector datasets).",
};

/** DP / Platinum / HGSS / Call of Legends. */
const DP_ERA: PackConfig = {
  era: "dp",
  cardsPerPack: 10,
  slots: [
    { name: "Common", count: 5, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 3, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Reverse Holo",
      count: 1,
      outcomes: [{ weight: 100, rarities: REVERSE_POOL, reverseHolo: true }],
    },
    {
      name: "Rare",
      count: 1,
      outcomes: [
        { weight: 56, rarities: ["Rare"] },
        { weight: 28, rarities: ["Rare Holo"], label: "Holo Rare" },
        { weight: 5, rarities: ["Rare Holo LV.X"], label: "LV.X" },
        { weight: 7, rarities: ["Rare Prime"], label: "Prime" },
        { weight: 2.8, rarities: ["LEGEND"], label: "LEGEND" },
        { weight: 1.2, rarities: ["Rare Ultra", "Rare Secret"], label: "Secret" },
      ],
    },
  ],
  rarityFallbacks: {
    "Rare Holo LV.X": ["Rare Holo"],
    "Rare Prime": ["Rare Holo"],
    LEGEND: ["Rare Holo"],
    "Rare Ultra": ["Rare Holo"],
    "Rare Secret": ["Rare Holo"],
  },
  sourceNotes:
    "DP/HGSS era: 10-card packs. Holo ~1:3.5, LV.X ~1:20, Prime ~2 per box, LEGEND halves ~1:36 per community estimates (Flipside Gaming, collector forums). Engine drops outcomes a set doesn't contain.",
};

/** Black & White era. */
const BW_ERA: PackConfig = {
  era: "bw",
  cardsPerPack: 10,
  slots: [
    { name: "Common", count: 5, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 3, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Reverse Holo",
      count: 1,
      outcomes: [{ weight: 100, rarities: REVERSE_POOL, reverseHolo: true }],
    },
    {
      name: "Rare",
      count: 1,
      outcomes: [
        { weight: 53, rarities: ["Rare"] },
        { weight: 28, rarities: ["Rare Holo"], label: "Holo Rare" },
        { weight: 12.5, rarities: ["Rare Holo EX"], label: "Pokémon-EX" },
        { weight: 5.1, rarities: ["Rare Ultra"], label: "Full Art" },
        { weight: 1.4, rarities: ["Rare Secret"], label: "Secret Rare" },
      ],
    },
  ],
  rarityFallbacks: {
    "Rare Holo EX": ["Rare Holo"],
    "Rare Ultra": ["Rare Holo EX", "Rare Holo"],
    "Rare Secret": ["Rare Ultra", "Rare Holo"],
  },
  sourceNotes:
    "BW era: EX ~1:8, Full Art ~1:18-20, Secret ~1:72 per community consensus (Flipside Gaming rarity review).",
};

/** XY era, including BREAK sets. */
const XY_ERA: PackConfig = {
  era: "xy",
  cardsPerPack: 10,
  slots: [
    { name: "Common", count: 5, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 3, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Reverse Holo",
      count: 1,
      outcomes: [{ weight: 100, rarities: REVERSE_POOL, reverseHolo: true }],
    },
    {
      name: "Rare",
      count: 1,
      outcomes: [
        { weight: 51, rarities: ["Rare"] },
        { weight: 27.5, rarities: ["Rare Holo"], label: "Holo Rare" },
        { weight: 11, rarities: ["Rare Holo EX"], label: "Pokémon-EX / Mega" },
        { weight: 5, rarities: ["Rare BREAK"], label: "BREAK" },
        { weight: 4.2, rarities: ["Rare Ultra"], label: "Full Art" },
        { weight: 1.3, rarities: ["Rare Secret"], label: "Secret Rare" },
      ],
    },
  ],
  rarityFallbacks: {
    "Rare Holo EX": ["Rare Holo"],
    "Rare BREAK": ["Rare Holo"],
    "Rare Ultra": ["Rare Holo EX", "Rare Holo"],
    "Rare Secret": ["Rare Ultra", "Rare Holo"],
  },
  sourceNotes:
    "XY era: EX ~1:9-12 (improved over the era), Full Art ~1:24, Secret ~1:72-77 per community consensus (Flipside Gaming, Elite Fourum).",
};

/** Sun & Moon era. */
const SM_ERA: PackConfig = {
  era: "sm",
  cardsPerPack: 10,
  slots: [
    { name: "Common", count: 5, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 3, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Reverse Holo",
      count: 1,
      outcomes: [
        { weight: 96, rarities: REVERSE_POOL, reverseHolo: true },
        { weight: 4, rarities: ["Rare Prism Star"], label: "Prism Star" },
      ],
    },
    {
      name: "Rare",
      count: 1,
      outcomes: [
        { weight: 49.35, rarities: ["Rare"] },
        { weight: 33, rarities: ["Rare Holo"], label: "Holo Rare" },
        { weight: 11.15, rarities: ["Rare Holo GX"], label: "Pokémon-GX" },
        { weight: 4.22, rarities: ["Rare Ultra"], label: "Full Art" },
        { weight: 1.47, rarities: ["Rare Rainbow"], label: "Rainbow Rare" },
        { weight: 0.81, rarities: ["Rare Secret", "Rare Shiny", "Rare Shiny GX"], label: "Secret / Shiny" },
      ],
    },
  ],
  rarityFallbacks: {
    "Rare Holo GX": ["Rare Holo"],
    "Rare Ultra": ["Rare Holo GX", "Rare Holo"],
    "Rare Rainbow": ["Rare Ultra", "Rare Holo"],
    "Rare Secret": ["Rare Rainbow", "Rare Ultra", "Rare Holo"],
    "Rare Prism Star": ["Rare Holo"],
  },
  sourceNotes:
    "SM era from Elite Fourum burpies dataset (thousands of packs): GX 11.15%±0.74 (1:9), Full Art UR 4.22%±0.47 (1:24), Rainbow 1.47%±0.28 (1:68), gold Secret 0.81%±0.21 (1:123).",
};

/** Sword & Shield era, including Trainer Gallery sets. */
const SWSH_ERA: PackConfig = {
  era: "swsh",
  cardsPerPack: 10,
  slots: [
    { name: "Common", count: 5, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 3, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Reverse Holo",
      count: 1,
      outcomes: [
        { weight: 82.5, rarities: REVERSE_POOL, reverseHolo: true },
        { weight: 9, rarities: ["Trainer Gallery Rare Holo"], label: "Trainer Gallery" },
        { weight: 3, rarities: ["Radiant Rare"], label: "Radiant" },
        { weight: 5.5, rarities: ["Amazing Rare"], label: "Amazing Rare" },
      ],
    },
    {
      name: "Rare",
      count: 1,
      outcomes: [
        { weight: 40.5, rarities: ["Rare"] },
        { weight: 24, rarities: ["Rare Holo"], label: "Holo Rare" },
        { weight: 14.2, rarities: ["Rare Holo V"], label: "Pokémon V" },
        { weight: 8.66, rarities: ["Rare Holo VMAX", "Rare Holo VSTAR"], label: "VMAX / VSTAR" },
        { weight: 3.74, rarities: ["Rare Ultra"], label: "Full Art / Alt Art" },
        { weight: 1.23, rarities: ["Rare Rainbow"], label: "Rainbow Rare" },
        { weight: 0.91, rarities: ["Rare Secret"], label: "Gold Secret" },
        { weight: 6.76, rarities: ["Rare Holo"], label: "Holo (balance)" },
      ],
    },
  ],
  rarityFallbacks: {
    "Rare Holo V": ["Rare Holo"],
    "Rare Holo VMAX": ["Rare Holo V", "Rare Holo"],
    "Rare Holo VSTAR": ["Rare Holo V", "Rare Holo"],
    "Rare Ultra": ["Rare Holo V", "Rare Holo"],
    "Rare Rainbow": ["Rare Ultra", "Rare Holo"],
    "Rare Secret": ["Rare Rainbow", "Rare Ultra", "Rare Holo"],
    "Trainer Gallery Rare Holo": REVERSE_POOL,
    "Radiant Rare": REVERSE_POOL,
    "Amazing Rare": REVERSE_POOL,
  },
  sourceNotes:
    "SWSH era from Elite Fourum burpies dataset + TCGplayer studies: V 14.20%±1.01 (1:7), VMAX 2.2-5.6% by set, Ultra (FA/alt) 3.74%±0.55 (1:27; alt-art VMAX as low as 1:332 in Evolving Skies), Rainbow 1.23%±0.32 (1:81), Secret 0.91%±0.27 (1:110). Trainer Gallery ~1:11 in reverse slot (Brilliant Stars+).",
};

/** Scarlet & Violet era default. */
const SV_ERA: PackConfig = {
  era: "sv",
  cardsPerPack: 10,
  slots: [
    { name: "Common", count: 4, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 3, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Reverse Holo",
      count: 1,
      outcomes: [
        { weight: 92.3, rarities: REVERSE_POOL, reverseHolo: true },
        { weight: 7.7, rarities: ["Illustration Rare"], label: "Illustration Rare" },
      ],
    },
    {
      name: "Special Foil",
      count: 1,
      outcomes: [
        { weight: 93.1, rarities: REVERSE_POOL, reverseHolo: true },
        { weight: 3.2, rarities: ["Special Illustration Rare"], label: "Special Illustration Rare" },
        { weight: 1.85, rarities: ["Hyper Rare"], label: "Hyper Rare" },
        { weight: 1.85, rarities: ["ACE SPEC Rare"], label: "ACE SPEC" },
      ],
    },
    {
      name: "Rare",
      count: 1,
      outcomes: [
        { weight: 79.7, rarities: ["Rare"] },
        { weight: 13.7, rarities: ["Double Rare"], label: "Double Rare (ex)" },
        { weight: 6.6, rarities: ["Ultra Rare"], label: "Ultra Rare" },
      ],
    },
  ],
  rarityFallbacks: {
    "Double Rare": ["Rare"],
    "Ultra Rare": ["Double Rare", "Rare"],
    "Illustration Rare": REVERSE_POOL,
    "Special Illustration Rare": REVERSE_POOL,
    "Hyper Rare": REVERSE_POOL,
    "ACE SPEC Rare": REVERSE_POOL,
    "Shiny Rare": REVERSE_POOL,
  },
  sourceNotes:
    "SV era baseline from ThePriceDex sv1 model + TCGplayer studies: Double Rare 1:7.3 (13.7%), Ultra Rare 1:15.2 (6.6%), IR 1:13 (7.7%), SIR 1:31.7 (3.2%), Hyper 1:54 (1.9%). ACE SPEC appears from Temporal Forces onward; outcome auto-drops for sets without it.",
};

/** Scarlet & Violet 151 (sv3pt5) — TCGplayer confidence-interval data. */
const SV_151: PackConfig = {
  ...SV_ERA,
  slots: [
    { name: "Common", count: 4, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 3, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Reverse Holo",
      count: 1,
      outcomes: [
        { weight: 91.5, rarities: REVERSE_POOL, reverseHolo: true },
        { weight: 8.5, rarities: ["Illustration Rare"], label: "Illustration Rare" },
      ],
    },
    {
      name: "Special Foil",
      count: 1,
      outcomes: [
        { weight: 94.95, rarities: REVERSE_POOL, reverseHolo: true },
        { weight: 3.11, rarities: ["Special Illustration Rare"], label: "Special Illustration Rare" },
        { weight: 1.94, rarities: ["Hyper Rare"], label: "Hyper Rare" },
      ],
    },
    {
      name: "Rare",
      count: 1,
      outcomes: [
        { weight: 80.28, rarities: ["Rare"] },
        { weight: 13.28, rarities: ["Double Rare"], label: "Double Rare (ex)" },
        { weight: 6.44, rarities: ["Ultra Rare"], label: "Ultra Rare" },
      ],
    },
  ],
  godPack: {
    // Nod to the Japanese sv2a god packs (every card an IR or better);
    // English 151 had none, so keep it a genuinely once-in-a-lifetime event.
    chance: 0.0005,
    rarities: ["Illustration Rare", "Special Illustration Rare", "Hyper Rare"],
  },
  sourceNotes:
    "SV 151 (sv3pt5) from TCGplayer 95% CI study: Double Rare 13.28%±1.57, Ultra Rare 6.44%±1.13, IR 8.50%±1.29 (1:12), SIR 3.11%±0.80 (1:32), Hyper 1.94%±0.64 (1:51). God pack mirrors Japanese sv2a (~1:2000, not present in English print).",
};

/** Mega Evolution era (2025+). */
const ME_ERA: PackConfig = {
  era: "me",
  cardsPerPack: 10,
  slots: [
    { name: "Common", count: 4, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 3, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Reverse Holo",
      count: 1,
      outcomes: [
        { weight: 92.3, rarities: REVERSE_POOL, reverseHolo: true },
        { weight: 7.7, rarities: ["Illustration Rare"], label: "Illustration Rare" },
      ],
    },
    {
      name: "Special Foil",
      count: 1,
      outcomes: [
        { weight: 98.45, rarities: REVERSE_POOL, reverseHolo: true },
        { weight: 1.0, rarities: ["Special Illustration Rare"], label: "Special Illustration Rare" },
        { weight: 0.55, rarities: ["Mega Hyper Rare"], label: "Mega Hyper Rare" },
      ],
    },
    {
      name: "Rare",
      count: 1,
      outcomes: [
        { weight: 76.2, rarities: ["Rare"] },
        { weight: 13.7, rarities: ["Double Rare"], label: "Double Rare (ex)" },
        { weight: 6.6, rarities: ["Ultra Rare"], label: "Ultra Rare" },
        { weight: 3.5, rarities: ["MEGA_ATTACK_RARE"], label: "Mega Attack Rare" },
      ],
    },
  ],
  rarityFallbacks: {
    "Double Rare": ["Rare"],
    "Ultra Rare": ["Double Rare", "Rare"],
    MEGA_ATTACK_RARE: ["Ultra Rare", "Double Rare", "Rare"],
    "Illustration Rare": REVERSE_POOL,
    "Special Illustration Rare": REVERSE_POOL,
    "Mega Hyper Rare": REVERSE_POOL,
  },
  sourceNotes:
    "Mega Evolution era: community trackers (Catchinary aggregation of 8k+ pack datasets) report SIR-tier ~1:100 packs, notably harsher than early SV. IR ~1:13 per modern-era priors; DR/UR carried from SV-era baselines; Mega Attack Rare rate is a community estimate pending larger samples.",
};

/** Generic fallback for promos / POP / odd products. */
const GENERIC: PackConfig = {
  era: "other",
  cardsPerPack: 10,
  slots: [
    { name: "Common", count: 6, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 3, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Rare",
      count: 1,
      outcomes: [
        { weight: 70, rarities: ["Rare"] },
        { weight: 30, rarities: ["Rare Holo", "Rare Ultra", "Rare Secret"], label: "Holo or better" },
      ],
    },
  ],
  sourceNotes: "Generic structure for products without documented booster odds.",
};

const ERA_BY_SERIES: Record<string, PackConfig> = {
  Base: VINTAGE,
  Gym: VINTAGE,
  Neo: VINTAGE,
  "E-Card": VINTAGE,
  EX: EX_ERA,
  "Diamond & Pearl": DP_ERA,
  Platinum: DP_ERA,
  "HeartGold & SoulSilver": DP_ERA,
  "Black & White": BW_ERA,
  XY: XY_ERA,
  "Sun & Moon": SM_ERA,
  "Sword & Shield": SWSH_ERA,
  "Scarlet & Violet": SV_ERA,
  "Mega Evolution": ME_ERA,
};

/** Set-specific overrides keyed by set id. */
const SET_OVERRIDES: Record<string, PackConfig> = {
  sv3pt5: SV_151,
};

export function packConfigForSet(setId: string, series: string): PackConfig {
  return SET_OVERRIDES[setId] ?? ERA_BY_SERIES[series] ?? GENERIC;
}

export const ERA_CONFIGS = {
  VINTAGE,
  EX_ERA,
  DP_ERA,
  BW_ERA,
  XY_ERA,
  SM_ERA,
  SWSH_ERA,
  SV_ERA,
  SV_151,
  ME_ERA,
  GENERIC,
};

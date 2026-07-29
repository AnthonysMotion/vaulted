import type { PackConfig } from "./types";

/**
 * Era pack configurations, matching real English booster game-card slot
 * structures. Energy cards / TCG Live codes sit *outside* the game-card count
 * and are not simulated here.
 *
 * Rarity weights come from community datasets (TCGplayer Infinite CIs,
 * Elite Fourum burpies samples, ThePriceDex, Flipside Gaming rarity reviews)
 * laid onto the documented slot skeleton for each era.
 *
 * Outcomes whose rarity pools don't exist in a set are dropped at open-time,
 * so one era config safely covers sets with slightly different line-ups.
 */

const REVERSE_POOL = ["Common", "Uncommon", "Rare", "Rare Holo"];

// ---------------------------------------------------------------------------
// 1. Vintage (Base Set → Neo) — 11 cards: 7C / 3U / 1 Rare
// ---------------------------------------------------------------------------

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
        // ~1:3 packs are holofoil; otherwise non-holo rare.
        { weight: 66.7, rarities: ["Rare"], label: "Non-Holo Rare" },
        { weight: 30, rarities: ["Rare Holo"], label: "Holofoil Rare" },
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
    "Vintage (Base→Neo): 11 game cards — 7C / 3U / 1 Rare (~1:3 Holofoil Rare). No reverse slot. Shining Pokémon (Neo Destiny) ~1:30.",
};

// ---------------------------------------------------------------------------
// 2. Legendary Collection — 11 cards: 6C / 3U / 1 Reverse / 1 Rare
// ---------------------------------------------------------------------------

const LEGENDARY_COLLECTION: PackConfig = {
  era: "legendary-collection",
  cardsPerPack: 11,
  slots: [
    { name: "Common", count: 6, outcomes: [{ weight: 100, rarities: ["Common"] }] },
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
        { weight: 67, rarities: ["Rare"], label: "Non-Holo Rare" },
        { weight: 33, rarities: ["Rare Holo"], label: "Holofoil Rare" },
      ],
    },
  ],
  rarityFallbacks: { "Rare Holo": ["Rare"] },
  sourceNotes:
    "Legendary Collection (bridge set): 11 game cards — 6C / 3U / 1 guaranteed Reverse Holo (any rarity) / 1 Rare (non-holo or holofoil). First English set with a dedicated reverse slot.",
};

// ---------------------------------------------------------------------------
// 3. e-Card era — 9 cards: 5C / 2U / 1 Reverse / 1 Rare
// ---------------------------------------------------------------------------

const ECARD_ERA: PackConfig = {
  era: "ecard",
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
        { weight: 67, rarities: ["Rare"], label: "Non-Holo Rare" },
        { weight: 33, rarities: ["Rare Holo"], label: "Holofoil Rare" },
      ],
    },
  ],
  rarityFallbacks: { "Rare Holo": ["Rare"] },
  sourceNotes:
    "e-Card (Expedition / Aquapolis / Skyridge): 9 game cards — 5C / 2U / 1 Reverse / 1 Rare. Pack size reduced for e-Reader dot-code costs.",
};

// ---------------------------------------------------------------------------
// 4. EX era — 9 cards: 5C / 2U / 1 Reverse / 1 Rare (upgradable)
// ---------------------------------------------------------------------------

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
        { weight: 61, rarities: ["Rare"], label: "Non-Holo Rare" },
        { weight: 29, rarities: ["Rare Holo"], label: "Holofoil Rare" },
        { weight: 8.3, rarities: ["Rare Holo EX"], label: "Pokémon-ex" },
        {
          weight: 1.4,
          rarities: ["Rare Holo Star", "Rare Ultra", "Rare Secret"],
          label: "Gold Star / Secret",
        },
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
    "EX era: 9 game cards — 5C / 2U / 1 Reverse (often stamped) / 1 Rare (Holo / Pokémon-ex / Gold Star). rates: Holo ~1:3, ex ~1:12, Gold Star ~1:72 (Flipside Gaming).",
};

// ---------------------------------------------------------------------------
// 5. Early modern (DP / Platinum / HGSS) — 10 cards: 5C / 3U / 1 Reverse / 1 Rare
// ---------------------------------------------------------------------------

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
        { weight: 56, rarities: ["Rare"], label: "Non-Holo Rare" },
        { weight: 28, rarities: ["Rare Holo"], label: "Holofoil Rare" },
        { weight: 5, rarities: ["Rare Holo LV.X"], label: "Pokémon LV.X" },
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
    "Early modern (DP/Platinum/HGSS): 10 game cards — 5C / 3U / 1 Reverse / 1 Rare (Holo / LV.X / Prime / LEGEND). Standard pack size established here.",
};

// ---------------------------------------------------------------------------
// 6. BW / XY / SM — 10 cards: 5C / 3U / 1 Reverse / 1 Rare (+ code card extra)
// ---------------------------------------------------------------------------

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
        { weight: 53, rarities: ["Rare"], label: "Non-Holo Rare" },
        { weight: 28, rarities: ["Rare Holo"], label: "Holofoil Rare" },
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
    "Black & White: 10 game cards — 5C / 3U / 1 Reverse / 1 Rare (+ TCGO code outside count). EX ~1:8, Full Art ~1:18–20, Secret ~1:72.",
};

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
        { weight: 51, rarities: ["Rare"], label: "Non-Holo Rare" },
        { weight: 27.5, rarities: ["Rare Holo"], label: "Holofoil Rare" },
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
    "XY: 10 game cards — 5C / 3U / 1 Reverse / 1 Rare (+ code). EX/Mega ~1:9–12, BREAK, Full Art ~1:24, Secret ~1:72–77.",
};

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
        { weight: 49.35, rarities: ["Rare"], label: "Non-Holo Rare" },
        { weight: 33, rarities: ["Rare Holo"], label: "Holofoil Rare" },
        { weight: 11.15, rarities: ["Rare Holo GX"], label: "Pokémon-GX" },
        { weight: 4.22, rarities: ["Rare Ultra"], label: "Full Art" },
        { weight: 1.47, rarities: ["Rare Rainbow"], label: "Rainbow Rare" },
        {
          weight: 0.81,
          rarities: ["Rare Secret", "Rare Shiny", "Rare Shiny GX"],
          label: "Secret / Shiny",
        },
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
    "Sun & Moon: 10 game cards — 5C / 3U / 1 Reverse / 1 Rare (+ code). Elite Fourum: GX 11.15%, Full Art 4.22%, Rainbow 1.47%, Secret 0.81%.",
};

// ---------------------------------------------------------------------------
// 7. Sword & Shield — 10 cards: 5C / 3U / 1 Reverse / 1 Rare
//    (+ Basic Energy + Live code outside count)
// ---------------------------------------------------------------------------

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
        { weight: 40.5, rarities: ["Rare"], label: "Non-Holo Rare" },
        { weight: 30.76, rarities: ["Rare Holo"], label: "Holofoil Rare" },
        { weight: 14.2, rarities: ["Rare Holo V"], label: "Pokémon V" },
        { weight: 8.66, rarities: ["Rare Holo VMAX", "Rare Holo VSTAR"], label: "VMAX / VSTAR" },
        { weight: 3.74, rarities: ["Rare Ultra"], label: "Full Art / Alt Art" },
        { weight: 1.23, rarities: ["Rare Rainbow"], label: "Rainbow Rare" },
        { weight: 0.91, rarities: ["Rare Secret"], label: "Gold Secret" },
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
    "Sword & Shield: 10 game cards — 5C / 3U / 1 Reverse (Trainer Gallery / Radiant / Amazing) / 1 Rare (V / VMAX / VSTAR / Secret). +1 Basic Energy + Live code outside count. Elite Fourum + TCGplayer.",
};

// ---------------------------------------------------------------------------
// 8. Current era (SV → Mega Evolution) — 10 cards:
//    4C / 3U / 2 Foil / 1 Premium Rare
//    (+ Basic Energy + Live code outside count)
//
// Foil slots hold Reverse / IR / ACE SPEC / SIR / Hyper so a pack can still
// contain e.g. Double Rare + SIR together (real English SV behaviour, backed
// by TCGplayer studies). Premium Rare is guaranteed Rare-or-better.
// ---------------------------------------------------------------------------

const SV_ERA: PackConfig = {
  era: "sv",
  cardsPerPack: 10,
  slots: [
    { name: "Common", count: 4, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 3, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Foil",
      count: 1,
      outcomes: [
        { weight: 92.3, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
        { weight: 7.7, rarities: ["Illustration Rare"], label: "Illustration Rare" },
      ],
    },
    {
      name: "Foil",
      count: 1,
      outcomes: [
        { weight: 93.1, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
        { weight: 3.2, rarities: ["Special Illustration Rare"], label: "Special Illustration Rare" },
        { weight: 1.85, rarities: ["Hyper Rare"], label: "Hyper Rare" },
        { weight: 1.85, rarities: ["ACE SPEC Rare"], label: "ACE SPEC" },
      ],
    },
    {
      name: "Premium Rare",
      count: 1,
      outcomes: [
        { weight: 79.7, rarities: ["Rare"], label: "Holofoil Rare" },
        { weight: 13.7, rarities: ["Double Rare"], label: "Pokémon ex (Double Rare)" },
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
    "Current era (SV): 10 game cards — 4C / 3U / 2 Foil (Reverse / IR / ACE SPEC / SIR / Hyper) / 1 Premium Rare (guaranteed Rare+). Energy + Live code outside count. Rates: ThePriceDex + TCGplayer (DR 13.7%, UR 6.6%, IR 7.7%, SIR 3.2%, Hyper 1.9%).",
};

const SV_151: PackConfig = {
  ...SV_ERA,
  slots: [
    { name: "Common", count: 4, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 3, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Foil",
      count: 1,
      outcomes: [
        { weight: 91.5, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
        { weight: 8.5, rarities: ["Illustration Rare"], label: "Illustration Rare" },
      ],
    },
    {
      name: "Foil",
      count: 1,
      outcomes: [
        { weight: 94.95, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
        { weight: 3.11, rarities: ["Special Illustration Rare"], label: "Special Illustration Rare" },
        { weight: 1.94, rarities: ["Hyper Rare"], label: "Hyper Rare" },
      ],
    },
    {
      name: "Premium Rare",
      count: 1,
      outcomes: [
        { weight: 80.28, rarities: ["Rare"], label: "Holofoil Rare" },
        { weight: 13.28, rarities: ["Double Rare"], label: "Pokémon ex (Double Rare)" },
        { weight: 6.44, rarities: ["Ultra Rare"], label: "Ultra Rare" },
      ],
    },
  ],
  godPack: {
    chance: 0.0005,
    rarities: ["Illustration Rare", "Special Illustration Rare", "Hyper Rare"],
  },
  sourceNotes:
    "SV 151: same current-era skeleton. TCGplayer 95% CI — DR 13.28%, UR 6.44%, IR 8.50% (1:12), SIR 3.11% (1:32), Hyper 1.94% (1:51). God pack nod to JP sv2a (~1:2000).",
};

const ME_ERA: PackConfig = {
  era: "me",
  cardsPerPack: 10,
  slots: [
    { name: "Common", count: 4, outcomes: [{ weight: 100, rarities: ["Common"] }] },
    { name: "Uncommon", count: 3, outcomes: [{ weight: 100, rarities: ["Uncommon"] }] },
    {
      name: "Foil",
      count: 1,
      outcomes: [
        { weight: 92.3, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
        { weight: 7.7, rarities: ["Illustration Rare"], label: "Illustration Rare" },
      ],
    },
    {
      name: "Foil",
      count: 1,
      outcomes: [
        { weight: 98.45, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
        { weight: 1.0, rarities: ["Special Illustration Rare"], label: "Special Illustration Rare" },
        { weight: 0.55, rarities: ["Mega Hyper Rare"], label: "Mega Hyper Rare" },
      ],
    },
    {
      name: "Premium Rare",
      count: 1,
      outcomes: [
        { weight: 76.2, rarities: ["Rare"], label: "Holofoil Rare" },
        { weight: 13.7, rarities: ["Double Rare"], label: "Pokémon ex (Double Rare)" },
        { weight: 6.6, rarities: ["Ultra Rare"], label: "Ultra Rare / Mega ex FA" },
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
    "Mega Evolution (current era): 4C / 3U / 2 Foil / 1 Premium Rare. SIR ~1:100 (Catchinary aggregation of large SV-era samples); IR ~1:13; Mega Attack Rare / Mega Hyper Rare rates provisional.",
};

// ---------------------------------------------------------------------------
// Generic fallback (promos / POP / McDonald's / etc.)
// ---------------------------------------------------------------------------

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
  sourceNotes: "Generic structure for products without a documented booster layout.",
};

const ERA_BY_SERIES: Record<string, PackConfig> = {
  Base: VINTAGE,
  Gym: VINTAGE,
  Neo: VINTAGE,
  "E-Card": ECARD_ERA,
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

const SET_OVERRIDES: Record<string, PackConfig> = {
  /** Legendary Collection — first English reverse-holo set. */
  base6: LEGENDARY_COLLECTION,
  /** SV 151 — TCGplayer CI rates. */
  sv3pt5: SV_151,
};

export function packConfigForSet(setId: string, series: string): PackConfig {
  return SET_OVERRIDES[setId] ?? ERA_BY_SERIES[series] ?? GENERIC;
}

export const ERA_CONFIGS = {
  VINTAGE,
  LEGENDARY_COLLECTION,
  ECARD_ERA,
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

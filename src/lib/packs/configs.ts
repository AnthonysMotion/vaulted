import { companionSetIdsFor } from "./companions";
import type { PackConfig, SlotConfig, SlotOutcome } from "./types";

/**
 * Era pack layouts for English boosters.
 *
 * Core rules:
 * - Never draw a pack as "N random cards from the set".
 * - Fill predefined slots left-to-right; each slot has a limited rarity pool.
 * - Sets inherit an era layout; SET_OVERRIDES only change what differs.
 * - Energy occupies its own slot and is excluded from Common/Uncommon/etc.
 * - Trainer Gallery / Galarian Gallery replace the Reverse slot only.
 * - SV Illustration Rare / SIR / Hyper Rare occupy Reverse Slot 2, not Rare.
 *
 * Weights from community datasets (Elite Fourum, TCGplayer Infinite CIs,
 * ThePriceDex) laid onto the documented slot skeleton for each era.
 */

const REVERSE_POOL = ["Common", "Uncommon", "Rare", "Rare Holo"];

const common = (count: number): SlotConfig => ({
  name: "Common",
  count,
  outcomes: [{ weight: 100, rarities: ["Common"] }],
});

const uncommon = (count: number): SlotConfig => ({
  name: "Uncommon",
  count,
  outcomes: [{ weight: 100, rarities: ["Uncommon"] }],
});

const energy = (count = 1): SlotConfig => ({
  name: "Energy",
  count,
  outcomes: [{ weight: 100, rarities: ["Common"], energyOnly: true, label: "Basic Energy" }],
});

const reverseSlot = (
  name: string,
  outcomes: SlotOutcome[],
  count = 1,
): SlotConfig => ({ name, count, outcomes });

const rareSlot = (outcomes: SlotOutcome[]): SlotConfig => ({
  name: "Rare Slot",
  count: 1,
  outcomes,
});

// ---------------------------------------------------------------------------
// ERA 1: Base Set → Neo Destiny (1999–2002)
// 5C / 2 Energy / 3U / 1 Rare. No reverse.
// ---------------------------------------------------------------------------

const VINTAGE: PackConfig = {
  era: "vintage",
  cardsPerPack: 11,
  slots: [
    common(5),
    energy(2),
    uncommon(3),
    rareSlot([
      { weight: 66.7, rarities: ["Rare"], label: "Rare" },
      { weight: 30, rarities: ["Rare Holo"], label: "Holo Rare" },
      { weight: 3.3, rarities: ["Rare Shining"], label: "Shining" },
    ]),
  ],
  rarityFallbacks: {
    "Rare Holo": ["Rare"],
    "Rare Shining": ["Rare Holo", "Rare"],
  },
  sourceNotes:
    "Era 1 (Base→Neo): 5 Common / 2 Basic Energy / 3 Uncommon / 1 Rare (Rare or Holo). No reverse holos. Neo Destiny Shining ~1:30.",
};

// ---------------------------------------------------------------------------
// ERA 2: Legendary Collection
// 5C / 2 Energy / 3U / 1 Reverse / 1 Rare
// ---------------------------------------------------------------------------

const LEGENDARY_COLLECTION: PackConfig = {
  era: "legendary-collection",
  cardsPerPack: 12,
  slots: [
    common(5),
    energy(2),
    uncommon(3),
    reverseSlot("Reverse Slot", [
      { weight: 100, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
    ]),
    rareSlot([
      { weight: 67, rarities: ["Rare"], label: "Rare" },
      { weight: 33, rarities: ["Rare Holo"], label: "Holo Rare" },
    ]),
  ],
  rarityFallbacks: { "Rare Holo": ["Rare"] },
  sourceNotes:
    "Era 2 (Legendary Collection): 5C / 2 Energy / 3U / 1 Reverse (C/U/R) / 1 Rare. First English dedicated reverse slot.",
};

// ---------------------------------------------------------------------------
// ERA 3: e-Reader (Expedition / Aquapolis / Skyridge)
// 5C / 2U / 1 Reverse / 1 Rare (+ Crystal in rare slot)
// ---------------------------------------------------------------------------

const ECARD_ERA: PackConfig = {
  era: "ecard",
  cardsPerPack: 9,
  slots: [
    common(5),
    uncommon(2),
    reverseSlot("Reverse Slot", [
      { weight: 100, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
    ]),
    rareSlot([
      { weight: 64, rarities: ["Rare"], label: "Rare" },
      { weight: 32, rarities: ["Rare Holo"], label: "Holo Rare" },
      // Crystal Pokémon are tagged Rare Holo in pokemon-tcg-data; weight
      // stays in the holo bucket. Kept as a documented rare-slot outcome.
      { weight: 4, rarities: ["Rare Secret"], label: "Crystal / Secret" },
    ]),
  ],
  rarityFallbacks: {
    "Rare Holo": ["Rare"],
    "Rare Secret": ["Rare Holo", "Rare"],
  },
  sourceNotes:
    "Era 3 (e-Card): 5C / 2U / 1 Reverse / 1 Rare (Rare / Holo / Crystal). Pack size reduced for e-Reader costs.",
};

// ---------------------------------------------------------------------------
// ERA 4: EX Series
// 5C / 2U / 1 Reverse / 1 Rare (ex / Gold Star)
// ---------------------------------------------------------------------------

const EX_ERA: PackConfig = {
  era: "ex",
  cardsPerPack: 9,
  slots: [
    common(5),
    uncommon(2),
    reverseSlot("Reverse Slot", [
      { weight: 100, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
    ]),
    rareSlot([
      { weight: 61, rarities: ["Rare"], label: "Rare" },
      { weight: 29, rarities: ["Rare Holo"], label: "Holo Rare" },
      { weight: 8.3, rarities: ["Rare Holo EX"], label: "Pokémon-ex" },
      { weight: 1.4, rarities: ["Rare Holo Star"], label: "Gold Star" },
      { weight: 0.3, rarities: ["Rare Secret", "Rare Ultra"], label: "Secret" },
    ]),
  ],
  rarityFallbacks: {
    "Rare Holo EX": ["Rare Holo"],
    "Rare Holo Star": ["Rare Holo EX", "Rare Holo"],
    "Rare Ultra": ["Rare Holo EX", "Rare Holo"],
    "Rare Secret": ["Rare Holo"],
  },
  sourceNotes:
    "Era 4 (EX): 5C / 2U / 1 Reverse / 1 Rare (Holo / ex / Gold Star). Holo ~1:3, ex ~1:12, Gold Star ~1:72.",
};

// ---------------------------------------------------------------------------
// ERA 5: Diamond & Pearl
// 5C / 3U / 1 Reverse / 1 Rare (LV.X / Secret)
// ---------------------------------------------------------------------------

const DP_ERA: PackConfig = {
  era: "dp",
  cardsPerPack: 10,
  slots: [
    common(5),
    uncommon(3),
    reverseSlot("Reverse Slot", [
      { weight: 100, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
    ]),
    rareSlot([
      { weight: 56, rarities: ["Rare"], label: "Rare" },
      { weight: 30, rarities: ["Rare Holo"], label: "Holo Rare" },
      { weight: 10, rarities: ["Rare Holo LV.X"], label: "LV.X" },
      { weight: 4, rarities: ["Rare Secret", "Rare Ultra"], label: "Secret Rare" },
    ]),
  ],
  rarityFallbacks: {
    "Rare Holo LV.X": ["Rare Holo"],
    "Rare Ultra": ["Rare Holo"],
    "Rare Secret": ["Rare Holo"],
  },
  sourceNotes:
    "Era 5 (Diamond & Pearl): 5C / 3U / 1 Reverse / 1 Rare (Holo / LV.X / Secret).",
};

// ---------------------------------------------------------------------------
// ERA 6: Platinum (same layout; SP in rare slot)
// ---------------------------------------------------------------------------

const PLATINUM_ERA: PackConfig = {
  era: "platinum",
  cardsPerPack: 10,
  slots: [
    common(5),
    uncommon(3),
    reverseSlot("Reverse Slot", [
      { weight: 100, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
    ]),
    rareSlot([
      { weight: 54, rarities: ["Rare"], label: "Rare" },
      { weight: 33, rarities: ["Rare Holo"], label: "Holo Rare / SP" },
      { weight: 10, rarities: ["Rare Holo LV.X"], label: "LV.X" },
      { weight: 3, rarities: ["Rare Secret", "Rare Ultra"], label: "Secret Rare" },
    ]),
  ],
  rarityFallbacks: {
    "Rare Holo LV.X": ["Rare Holo"],
    "Rare Ultra": ["Rare Holo"],
    "Rare Secret": ["Rare Holo"],
  },
  sourceNotes:
    "Era 6 (Platinum): DP layout with LV.X / SP / Secret in the Rare slot.",
};

// ---------------------------------------------------------------------------
// ERA 7: HeartGold SoulSilver (Prime / LEGEND)
// ---------------------------------------------------------------------------

const HGSS_ERA: PackConfig = {
  era: "hgss",
  cardsPerPack: 10,
  slots: [
    common(5),
    uncommon(3),
    reverseSlot("Reverse Slot", [
      { weight: 100, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
    ]),
    rareSlot([
      { weight: 55, rarities: ["Rare"], label: "Rare" },
      { weight: 28, rarities: ["Rare Holo"], label: "Holo Rare" },
      { weight: 10, rarities: ["Rare Prime"], label: "Prime" },
      { weight: 5, rarities: ["LEGEND"], label: "LEGEND" },
      { weight: 2, rarities: ["Rare Secret", "Rare Ultra"], label: "Secret Rare" },
    ]),
  ],
  rarityFallbacks: {
    "Rare Prime": ["Rare Holo"],
    LEGEND: ["Rare Holo"],
    "Rare Ultra": ["Rare Holo"],
    "Rare Secret": ["Rare Holo"],
  },
  sourceNotes:
    "Era 7 (HGSS): 5C / 3U / 1 Reverse / 1 Rare (Prime / LEGEND).",
};

// ---------------------------------------------------------------------------
// ERA 8: Black & White
// ---------------------------------------------------------------------------

const BW_ERA: PackConfig = {
  era: "bw",
  cardsPerPack: 10,
  slots: [
    common(5),
    uncommon(3),
    reverseSlot("Reverse Slot", [
      { weight: 100, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
    ]),
    rareSlot([
      { weight: 53, rarities: ["Rare"], label: "Rare" },
      { weight: 28, rarities: ["Rare Holo"], label: "Holo Rare" },
      { weight: 12.5, rarities: ["Rare Holo EX"], label: "Pokémon-EX" },
      { weight: 5.1, rarities: ["Rare Ultra"], label: "Full Art" },
      { weight: 1.4, rarities: ["Rare Secret"], label: "Secret Rare" },
    ]),
  ],
  rarityFallbacks: {
    "Rare Holo EX": ["Rare Holo"],
    "Rare Ultra": ["Rare Holo EX", "Rare Holo"],
    "Rare Secret": ["Rare Ultra", "Rare Holo"],
  },
  sourceNotes:
    "Era 8 (BW): 5C / 3U / 1 Reverse / 1 Rare (EX / Full Art / Secret).",
};

// ---------------------------------------------------------------------------
// ERA 9: XY
// ---------------------------------------------------------------------------

const XY_ERA: PackConfig = {
  era: "xy",
  cardsPerPack: 10,
  slots: [
    common(5),
    uncommon(3),
    reverseSlot("Reverse Slot", [
      { weight: 100, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
    ]),
    rareSlot([
      { weight: 51, rarities: ["Rare"], label: "Rare" },
      { weight: 27.5, rarities: ["Rare Holo"], label: "Holo Rare" },
      { weight: 11, rarities: ["Rare Holo EX"], label: "Pokémon-EX / Mega" },
      { weight: 5, rarities: ["Rare BREAK"], label: "BREAK" },
      { weight: 4.2, rarities: ["Rare Ultra"], label: "Full Art" },
      { weight: 1.3, rarities: ["Rare Secret"], label: "Secret Rare" },
    ]),
  ],
  rarityFallbacks: {
    "Rare Holo EX": ["Rare Holo"],
    "Rare BREAK": ["Rare Holo"],
    "Rare Ultra": ["Rare Holo EX", "Rare Holo"],
    "Rare Secret": ["Rare Ultra", "Rare Holo"],
  },
  sourceNotes:
    "Era 9 (XY): 5C / 3U / 1 Reverse / 1 Rare (EX / Mega / BREAK / Full Art / Secret).",
};

// ---------------------------------------------------------------------------
// ERA 10: Sun & Moon
// 5C / 1 Energy / 3U / 1 Reverse / 1 Rare
// ---------------------------------------------------------------------------

const SM_ERA: PackConfig = {
  era: "sm",
  cardsPerPack: 11,
  slots: [
    common(5),
    energy(1),
    uncommon(3),
    reverseSlot("Reverse Slot", [
      { weight: 96, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
      { weight: 4, rarities: ["Rare Prism Star"], label: "Prism Star" },
    ]),
    rareSlot([
      { weight: 49.35, rarities: ["Rare"], label: "Rare" },
      { weight: 33, rarities: ["Rare Holo"], label: "Holo Rare" },
      { weight: 11.15, rarities: ["Rare Holo GX"], label: "Pokémon-GX" },
      { weight: 4.22, rarities: ["Rare Ultra"], label: "Full Art GX" },
      { weight: 1.47, rarities: ["Rare Rainbow"], label: "Rainbow Rare" },
      {
        weight: 0.81,
        rarities: ["Rare Secret", "Rare Shiny", "Rare Shiny GX"],
        label: "Gold / Alternate Art",
      },
    ]),
  ],
  rarityFallbacks: {
    "Rare Holo GX": ["Rare Holo"],
    "Rare Ultra": ["Rare Holo GX", "Rare Holo"],
    "Rare Rainbow": ["Rare Ultra", "Rare Holo"],
    "Rare Secret": ["Rare Rainbow", "Rare Ultra", "Rare Holo"],
    "Rare Prism Star": ["Rare Holo"],
    "Rare Shiny": ["Rare Secret", "Rare Holo"],
    "Rare Shiny GX": ["Rare Secret", "Rare Holo"],
  },
  sourceNotes:
    "Era 10 (SM): 5C / 1 Energy / 3U / 1 Reverse / 1 Rare (GX / FA / Rainbow / Gold).",
};

// ---------------------------------------------------------------------------
// ERA 11: Sword & Shield
// 5C / 1 Energy / 3U / 1 Reverse / 1 Rare
// Trainer Gallery replaces Reverse only. Radiant / Amazing / V sit in Rare.
// ---------------------------------------------------------------------------

function swshReverseOutcomes(companionIds: string[] = []): SlotOutcome[] {
  const outcomes: SlotOutcome[] = [
    { weight: 88, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
  ];
  if (companionIds.length > 0) {
    outcomes.push({
      weight: 12,
      rarities: [],
      fromSetIds: companionIds,
      label: "Trainer Gallery",
    });
  }
  return outcomes;
}

const SWSH_RARE: SlotOutcome[] = [
  { weight: 40.5, rarities: ["Rare"], label: "Rare" },
  { weight: 28, rarities: ["Rare Holo"], label: "Holo Rare" },
  { weight: 4, rarities: ["Amazing Rare"], label: "Amazing Rare" },
  { weight: 3, rarities: ["Radiant Rare"], label: "Radiant Pokémon" },
  { weight: 13, rarities: ["Rare Holo V"], label: "Pokémon V" },
  { weight: 7.5, rarities: ["Rare Holo VMAX", "Rare Holo VSTAR"], label: "VMAX / VSTAR" },
  { weight: 2.8, rarities: ["Rare Ultra"], label: "Full Art / Alternate Art" },
  { weight: 0.8, rarities: ["Rare Rainbow"], label: "Rainbow Rare" },
  { weight: 0.4, rarities: ["Rare Secret"], label: "Gold Secret Rare" },
];

const SWSH_FALLBACKS: PackConfig["rarityFallbacks"] = {
  "Rare Holo V": ["Rare Holo"],
  "Rare Holo VMAX": ["Rare Holo V", "Rare Holo"],
  "Rare Holo VSTAR": ["Rare Holo V", "Rare Holo"],
  "Rare Ultra": ["Rare Holo V", "Rare Holo"],
  "Rare Rainbow": ["Rare Ultra", "Rare Holo"],
  "Rare Secret": ["Rare Rainbow", "Rare Ultra", "Rare Holo"],
  "Amazing Rare": ["Rare Holo"],
  "Radiant Rare": ["Rare Holo"],
  "Trainer Gallery Rare Holo": REVERSE_POOL,
};

function makeSwshConfig(
  setId: string | null,
  extras?: Partial<PackConfig>,
): PackConfig {
  const companions = setId ? companionSetIdsFor(setId) : [];
  return {
    era: "swsh",
    cardsPerPack: 11,
    companionSetIds: companions.length > 0 ? companions : undefined,
    slots: [
      common(5),
      energy(1),
      uncommon(3),
      reverseSlot("Reverse Slot", swshReverseOutcomes(companions)),
      rareSlot(SWSH_RARE),
    ],
    rarityFallbacks: SWSH_FALLBACKS,
    sourceNotes:
      "Era 11 (SWSH): 5C / 1 Energy / 3U / 1 Reverse (or Trainer Gallery) / 1 Rare (V / VMAX / VSTAR / Amazing / Radiant / Secret). Gallery never replaces the Rare slot.",
    ...extras,
  };
}

const SWSH_ERA = makeSwshConfig(null);

// ---------------------------------------------------------------------------
// ERA 12: Scarlet & Violet
// 4C / 3U / Reverse1 / Reverse2 / Rare / Energy
//
// Reverse 1: reverse holos (+ ACE SPEC / Baby Shiny where set overrides say)
// Reverse 2: reverse OR IR / SIR / Hyper Rare
// Rare Slot: Rare / Double Rare / Ultra Rare  (never IR/SIR)
// ---------------------------------------------------------------------------

const SV_REVERSE_1: SlotOutcome[] = [
  { weight: 100, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
];

const SV_REVERSE_2: SlotOutcome[] = [
  { weight: 87.1, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
  { weight: 7.7, rarities: ["Illustration Rare"], label: "Illustration Rare" },
  { weight: 3.2, rarities: ["Special Illustration Rare"], label: "Special Illustration Rare" },
  { weight: 2.0, rarities: ["Hyper Rare"], label: "Hyper Rare" },
];

const SV_RARE: SlotOutcome[] = [
  { weight: 79.7, rarities: ["Rare"], label: "Rare / Holo Rare" },
  { weight: 13.7, rarities: ["Double Rare"], label: "Double Rare (Pokémon ex)" },
  { weight: 6.6, rarities: ["Ultra Rare"], label: "Ultra Rare" },
];

const SV_FALLBACKS: PackConfig["rarityFallbacks"] = {
  "Double Rare": ["Rare"],
  "Ultra Rare": ["Double Rare", "Rare"],
  "Illustration Rare": REVERSE_POOL,
  "Special Illustration Rare": REVERSE_POOL,
  "Hyper Rare": REVERSE_POOL,
  "ACE SPEC Rare": REVERSE_POOL,
  "Shiny Rare": REVERSE_POOL,
  "Shiny Ultra Rare": ["Special Illustration Rare", "Hyper Rare"],
  "Black White Rare": ["Special Illustration Rare", "Hyper Rare"],
};

function makeSvConfig(
  reverse1: SlotOutcome[],
  reverse2: SlotOutcome[],
  rare: SlotOutcome[],
  extras?: Partial<PackConfig>,
): PackConfig {
  return {
    era: "sv",
    cardsPerPack: 11,
    slots: [
      common(4),
      uncommon(3),
      reverseSlot("Reverse Slot 1", reverse1),
      reverseSlot("Reverse Slot 2", reverse2),
      rareSlot(rare),
      energy(1),
    ],
    rarityFallbacks: SV_FALLBACKS,
    sourceNotes:
      "Era 12 (SV): 4C / 3U / Reverse1 / Reverse2 / Rare / Energy. IR/SIR/Hyper only in Reverse Slot 2. Rare Slot is Rare / Double Rare / Ultra Rare.",
    ...extras,
  };
}

const SV_ERA = makeSvConfig(SV_REVERSE_1, SV_REVERSE_2, SV_RARE);

/** Sets that print ACE SPEC into Reverse Slot 1. */
function withAceSpec(base: PackConfig = SV_ERA): PackConfig {
  return makeSvConfig(
    [
      { weight: 94, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
      { weight: 6, rarities: ["ACE SPEC Rare"], label: "ACE SPEC" },
    ],
    SV_REVERSE_2,
    SV_RARE,
    {
      sourceNotes:
        base.sourceNotes + " ACE SPEC available in Reverse Slot 1.",
    },
  );
}

const SV_151 = makeSvConfig(
  SV_REVERSE_1,
  [
    { weight: 86.45, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
    { weight: 8.5, rarities: ["Illustration Rare"], label: "Illustration Rare" },
    { weight: 3.11, rarities: ["Special Illustration Rare"], label: "Special Illustration Rare" },
    { weight: 1.94, rarities: ["Hyper Rare"], label: "Hyper Rare" },
  ],
  [
    { weight: 80.28, rarities: ["Rare"], label: "Rare / Holo Rare" },
    { weight: 13.28, rarities: ["Double Rare"], label: "Double Rare (Pokémon ex)" },
    { weight: 6.44, rarities: ["Ultra Rare"], label: "Ultra Rare" },
  ],
  {
    godPack: {
      chance: 0.0005,
      rarities: ["Illustration Rare", "Special Illustration Rare", "Hyper Rare"],
    },
    sourceNotes:
      "SV 151: standard SV layout. TCGplayer CI: DR 13.28%, UR 6.44%, IR 8.50%, SIR 3.11%, Hyper 1.94%. God pack ~1:2000.",
  },
);

/** Paldean Fates: Baby Shiny (Shiny Rare) in reverse slots. */
const PALDEAN_FATES = makeSvConfig(
  [
    { weight: 70, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
    { weight: 30, rarities: ["Shiny Rare"], label: "Shiny Rare" },
  ],
  [
    { weight: 55, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
    { weight: 28, rarities: ["Shiny Rare"], label: "Shiny Rare" },
    { weight: 8, rarities: ["Illustration Rare"], label: "Illustration Rare" },
    { weight: 5, rarities: ["Special Illustration Rare"], label: "Special Illustration Rare" },
    { weight: 2.5, rarities: ["Shiny Ultra Rare"], label: "Shiny Ultra Rare" },
    { weight: 1.5, rarities: ["Hyper Rare"], label: "Hyper Rare" },
  ],
  SV_RARE,
  {
    sourceNotes:
      "Paldean Fates: SV layout with Shiny Rare / Shiny Ultra Rare in reverse slots (Baby Shiny).",
  },
);

/** Crown Zenith: Galarian Gallery replaces Reverse slot only. */
function crownZenith(): PackConfig {
  const companions = companionSetIdsFor("swsh12pt5");
  return makeSwshConfig("swsh12pt5", {
    era: "swsh-crown-zenith",
    slots: [
      common(5),
      energy(1),
      uncommon(3),
      reverseSlot("Reverse Slot", [
        {
          weight: 100,
          rarities: [],
          fromSetIds: companions,
          label: "Galarian Gallery",
        },
      ]),
      rareSlot(SWSH_RARE),
    ],
    sourceNotes:
      "Crown Zenith: SWSH layout where Galarian Gallery replaces the Reverse slot only. Rare slot can still hit VMAX/VSTAR alongside a Gallery card.",
  });
}

/** Shining Fates: Shiny Vault feeds reverse upgrades. */
function shiningFates(): PackConfig {
  const companions = companionSetIdsFor("swsh45");
  return makeSwshConfig("swsh45", {
    era: "swsh-shining-fates",
    slots: [
      common(5),
      energy(1),
      uncommon(3),
      reverseSlot("Reverse Slot", [
        { weight: 70, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
        {
          weight: 25,
          rarities: [],
          fromSetIds: companions,
          label: "Shiny Vault",
        },
        { weight: 5, rarities: ["Amazing Rare"], label: "Amazing Rare" },
      ]),
      rareSlot([
        { weight: 42, rarities: ["Rare"], label: "Rare" },
        { weight: 28, rarities: ["Rare Holo"], label: "Holo Rare" },
        { weight: 8, rarities: ["Amazing Rare"], label: "Amazing Rare" },
        { weight: 14, rarities: ["Rare Holo V"], label: "Pokémon V" },
        { weight: 6, rarities: ["Rare Holo VMAX"], label: "VMAX" },
        { weight: 1.5, rarities: ["Rare Ultra", "Rare Rainbow"], label: "Full Art / Rainbow" },
        { weight: 0.5, rarities: ["Rare Secret"], label: "Gold Secret" },
      ]),
    ],
    sourceNotes:
      "Shining Fates: SWSH layout with Shiny Vault cards available in the Reverse slot.",
  });
}

/** Hidden Fates: Shiny Vault in reverse. */
function hiddenFates(): PackConfig {
  const companions = companionSetIdsFor("sm115");
  return {
    ...SM_ERA,
    era: "sm-hidden-fates",
    companionSetIds: companions,
    slots: [
      common(5),
      energy(1),
      uncommon(3),
      reverseSlot("Reverse Slot", [
        { weight: 72, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
        {
          weight: 28,
          rarities: [],
          fromSetIds: companions,
          label: "Shiny Vault",
        },
      ]),
      rareSlot([
        { weight: 48, rarities: ["Rare"], label: "Rare" },
        { weight: 30, rarities: ["Rare Holo"], label: "Holo Rare" },
        { weight: 12, rarities: ["Rare Holo GX"], label: "Pokémon-GX" },
        { weight: 6, rarities: ["Rare Ultra"], label: "Full Art" },
        { weight: 2.5, rarities: ["Rare Rainbow"], label: "Rainbow Rare" },
        { weight: 1.5, rarities: ["Rare Secret"], label: "Secret Rare" },
      ]),
    ],
    sourceNotes:
      "Hidden Fates: SM layout with Shiny Vault available in the Reverse slot.",
  };
}

const ME_ERA = makeSvConfig(
  SV_REVERSE_1,
  [
    { weight: 91.5, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
    { weight: 7.0, rarities: ["Illustration Rare"], label: "Illustration Rare" },
    { weight: 1.0, rarities: ["Special Illustration Rare"], label: "Special Illustration Rare" },
    { weight: 0.5, rarities: ["Mega Hyper Rare", "Hyper Rare"], label: "Mega Hyper Rare" },
  ],
  [
    { weight: 76.2, rarities: ["Rare"], label: "Rare / Holo Rare" },
    { weight: 13.7, rarities: ["Double Rare"], label: "Double Rare (Pokémon ex)" },
    { weight: 6.6, rarities: ["Ultra Rare"], label: "Ultra Rare / Mega ex FA" },
    { weight: 3.5, rarities: ["MEGA_ATTACK_RARE"], label: "Mega Attack Rare" },
  ],
  {
    era: "me",
    rarityFallbacks: {
      ...SV_FALLBACKS,
      MEGA_ATTACK_RARE: ["Ultra Rare", "Double Rare", "Rare"],
      "Mega Hyper Rare": ["Hyper Rare", "Special Illustration Rare"],
    },
    sourceNotes:
      "Mega Evolution: SV-style dual reverse + rare slots with Mega-specific chase rarities.",
  },
);

const GENERIC: PackConfig = {
  era: "other",
  cardsPerPack: 10,
  slots: [
    common(6),
    uncommon(3),
    rareSlot([
      { weight: 70, rarities: ["Rare"] },
      { weight: 30, rarities: ["Rare Holo", "Rare Ultra", "Rare Secret"], label: "Holo or better" },
    ]),
  ],
  sourceNotes: "Generic structure for products without a documented booster layout.",
};

// ---------------------------------------------------------------------------
// Series → era + set overrides
// ---------------------------------------------------------------------------

const ERA_BY_SERIES: Record<string, PackConfig> = {
  Base: VINTAGE,
  Gym: VINTAGE,
  Neo: VINTAGE,
  "E-Card": ECARD_ERA,
  EX: EX_ERA,
  "Diamond & Pearl": DP_ERA,
  Platinum: PLATINUM_ERA,
  "HeartGold & SoulSilver": HGSS_ERA,
  "Black & White": BW_ERA,
  XY: XY_ERA,
  "Sun & Moon": SM_ERA,
  "Sword & Shield": SWSH_ERA,
  "Scarlet & Violet": SV_ERA,
  "Mega Evolution": ME_ERA,
};

/** ACE SPEC print runs in SV. */
const ACE_SPEC_SETS = [
  "sv5", // Temporal Forces
  "sv6", // Twilight Masquerade
  "sv6pt5", // Shrouded Fable
  "sv7", // Stellar Crown
  "sv8", // Surging Sparks
  "sv8pt5", // Prismatic Evolutions
];

const SET_OVERRIDES: Record<string, PackConfig> = {
  base6: LEGENDARY_COLLECTION,
  sv3pt5: SV_151,
  sv4pt5: PALDEAN_FATES,
  swsh12pt5: crownZenith(),
  swsh45: shiningFates(),
  sm115: hiddenFates(),
  // Trainer Gallery parent sets. Reverse can upgrade to gallery.
  swsh9: makeSwshConfig("swsh9"),
  swsh10: makeSwshConfig("swsh10"),
  swsh11: makeSwshConfig("swsh11"),
  swsh12: makeSwshConfig("swsh12"),
};

for (const id of ACE_SPEC_SETS) {
  SET_OVERRIDES[id] = withAceSpec();
}

/** Black Bolt / White Flare: Black White Rare in Reverse Slot 2. */
for (const id of ["zsv10pt5", "rsv10pt5"]) {
  SET_OVERRIDES[id] = makeSvConfig(
    SV_REVERSE_1,
    [
      { weight: 84, rarities: REVERSE_POOL, reverseHolo: true, label: "Reverse Holo" },
      { weight: 12, rarities: ["Illustration Rare"], label: "Illustration Rare" },
      { weight: 2.5, rarities: ["Special Illustration Rare"], label: "Special Illustration Rare" },
      { weight: 1.5, rarities: ["Black White Rare", "Hyper Rare"], label: "Black White Rare" },
    ],
    SV_RARE,
    {
      sourceNotes:
        "Black Bolt / White Flare: SV layout with Black White Rare in Reverse Slot 2.",
    },
  );
}

export function packConfigForSet(setId: string, series: string): PackConfig {
  if (SET_OVERRIDES[setId]) return SET_OVERRIDES[setId];

  const base = ERA_BY_SERIES[series] ?? GENERIC;
  // Attach companion IDs for SWSH parents even when using the series default
  const companions = companionSetIdsFor(setId);
  if (companions.length === 0) return base;

  if (series === "Sword & Shield") {
    return makeSwshConfig(setId);
  }
  return { ...base, companionSetIds: companions };
}

export const ERA_CONFIGS = {
  VINTAGE,
  LEGENDARY_COLLECTION,
  ECARD_ERA,
  EX_ERA,
  DP_ERA,
  PLATINUM_ERA,
  HGSS_ERA,
  BW_ERA,
  XY_ERA,
  SM_ERA,
  SWSH_ERA,
  SV_ERA,
  SV_151,
  PALDEAN_FATES,
  ME_ERA,
  GENERIC,
};

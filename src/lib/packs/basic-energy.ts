import type { Card } from "@/db/schema";

/**
 * Standard Basic Energy used when a set's checklist has none.
 *
 * Modern SWSH/SV boosters still contain a Basic Energy card, but
 * pokemon-tcg-data often only lists chase foil Energy prints (Hyper Rare /
 * Secret) — or omits Energy entirely. Those chase prints must not fill the
 * Energy slot, so we fall back to these shared commons for pack display.
 *
 * IDs are synthetic (`__energy-*`) and must not be persisted to collections.
 */
const ENERGY_TYPES = [
  { key: "grass", name: "Grass Energy", image: "https://images.pokemontcg.io/sve/1.png" },
  { key: "fire", name: "Fire Energy", image: "https://images.pokemontcg.io/sve/2.png" },
  { key: "water", name: "Water Energy", image: "https://images.pokemontcg.io/sve/3.png" },
  { key: "lightning", name: "Lightning Energy", image: "https://images.pokemontcg.io/sve/4.png" },
  { key: "psychic", name: "Psychic Energy", image: "https://images.pokemontcg.io/sve/5.png" },
  { key: "fighting", name: "Fighting Energy", image: "https://images.pokemontcg.io/sve/6.png" },
  { key: "darkness", name: "Darkness Energy", image: "https://images.pokemontcg.io/sve/7.png" },
  { key: "metal", name: "Metal Energy", image: "https://images.pokemontcg.io/sve/8.png" },
] as const;

export const FALLBACK_ENERGY_ID_PREFIX = "__energy-";

export function isFallbackEnergyId(cardId: string): boolean {
  return cardId.startsWith(FALLBACK_ENERGY_ID_PREFIX);
}

export function createFallbackBasicEnergies(setId: string): Card[] {
  return ENERGY_TYPES.map((energy) => ({
    id: `${FALLBACK_ENERGY_ID_PREFIX}${energy.key}`,
    setId,
    name: energy.name,
    supertype: "Energy",
    subtypes: ["Basic"],
    level: null,
    hp: null,
    types: [],
    evolvesFrom: null,
    evolvesTo: [],
    rules: [],
    abilities: [],
    attacks: [],
    weaknesses: [],
    resistances: [],
    retreatCost: [],
    convertedRetreatCost: null,
    number: energy.key,
    rarity: "Common",
    artist: null,
    flavorText: null,
    nationalPokedexNumbers: [],
    regulationMark: null,
    imageSmall: energy.image,
    imageLarge: energy.image,
    prices: null,
  }));
}

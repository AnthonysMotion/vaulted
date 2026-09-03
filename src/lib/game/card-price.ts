export type PriceSnapshot = {
  tcgplayer?: Record<string, number | null>;
  cardmarket?: { averageSellPrice?: number | null; trendPrice?: number | null };
  updatedAt?: string;
};

const REVERSE_KEYS = ["reverseHolofoil", "reverseHolo"];
const STANDARD_KEYS = [
  "holofoil",
  "normal",
  "unlimitedHolofoil",
  "1stEditionHolofoil",
  "unlimited",
];

function firstNumeric(
  tcg: Record<string, number | null> | undefined,
  keys: string[],
): number | null {
  if (!tcg) return null;
  for (const key of keys) {
    const value = tcg[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

/** Market USD for the pulled finish. Reverse holos use the reverse foil row. */
export function pickMarketPrice(
  prices: PriceSnapshot | null | undefined,
  reverseHolo = false,
): number | null {
  const tcg = prices?.tcgplayer;
  if (!tcg) return null;
  if (reverseHolo) {
    return (
      firstNumeric(tcg, REVERSE_KEYS) ?? firstNumeric(tcg, STANDARD_KEYS)
    );
  }
  const standard = firstNumeric(tcg, STANDARD_KEYS);
  if (standard !== null) return standard;
  return firstNumeric(tcg, Object.keys(tcg));
}

export function formatMarketPrice(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `$${value.toFixed(2)}`;
}

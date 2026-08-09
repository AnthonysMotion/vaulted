import { packConfigForSet } from "@/lib/packs/configs";

/**
 * CSS border-radius for card faces / backs, tuned to how each era's scans
 * read on screen (WOTC fuller, modern slightly tighter).
 * Values are % of the card box so they scale with reveal size.
 */
const RADIUS_BY_ERA: Record<string, string> = {
  vintage: "6%",
  "legendary-collection": "6%",
  ecard: "5.25%",
  ex: "4.75%",
  dp: "4.5%",
  platinum: "4.5%",
  hgss: "4.5%",
  bw: "4.25%",
  xy: "4.25%",
  sm: "4%",
  "sm-hidden-fates": "4%",
  swsh: "3.75%",
  "swsh-crown-zenith": "3.75%",
  "swsh-shining-fates": "3.75%",
  sv: "3.75%",
  me: "3.75%",
  other: "4.25%",
};

/** Border-radius string for a set's card silhouette. */
export function cardCornerRadiusForSet(setId: string, series: string): string {
  const { era } = packConfigForSet(setId, series);
  return RADIUS_BY_ERA[era] ?? RADIUS_BY_ERA.other;
}

import type { Profile } from "@/db/schema";
import { DAILY_PACK_LIMIT } from "@/lib/game/constants";

export type PackMode = "sandbox" | "trainer";

/** Packs left today for a trainer (UTC day). */
export function packsRemainingToday(profile: Profile): number {
  const today = new Date().toISOString().slice(0, 10);
  const used = profile.lastPackDate === today ? profile.packsOpenedToday : 0;
  return Math.max(0, DAILY_PACK_LIMIT - used);
}

/**
 * Resolve open-pack mode.
 * Explicit `?mode=` wins. Otherwise: Trainer if logged in with packs left, else Sandbox.
 */
export function resolvePackMode(
  rawMode: string | undefined,
  profile: Profile | null | undefined,
): PackMode {
  if (rawMode === "sandbox") return "sandbox";
  if (rawMode === "trainer") return profile ? "trainer" : "sandbox";

  if (profile && packsRemainingToday(profile) > 0) return "trainer";
  return "sandbox";
}

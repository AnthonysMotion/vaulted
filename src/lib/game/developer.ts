import { redirect } from "next/navigation";
import type { Profile } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/game/profile";

/** Usernames granted developer on first profile create. */
export const BOOTSTRAP_DEVELOPER_USERNAMES = new Set(["anthonysmotion"]);

export function isBootstrapDeveloperUsername(username: string): boolean {
  return BOOTSTRAP_DEVELOPER_USERNAMES.has(username.toLowerCase());
}

export function isDeveloper(profile: Profile | null | undefined): boolean {
  return Boolean(profile?.isDeveloper);
}

/** Require a signed-in developer; otherwise send to login or home. */
export async function requireDeveloper(): Promise<Profile> {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/login?next=/dev/simulator");
  if (!profile.isDeveloper) redirect("/");
  return profile;
}

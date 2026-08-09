import { cache } from "react";
import { headers } from "next/headers";
import { db } from "@/db";
import { binders, profiles, type Profile } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isBootstrapDeveloperUsername } from "@/lib/game/developer";
import {
  parseVaultedUserId,
  VAULTED_USER_ID_HEADER,
} from "@/lib/auth/session-header";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

function usernameFromUser(user: User): string {
  const meta = user.user_metadata ?? {};
  const base: string =
    meta.username ??
    meta.user_name ??
    meta.preferred_username ??
    meta.full_name ??
    meta.name ??
    user.email?.split("@")[0] ??
    "trainer";
  return (
    String(base)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20) || "trainer"
  );
}

function avatarFromUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const url = meta.avatar_url ?? meta.picture;
  return typeof url === "string" && url.startsWith("http") ? url : null;
}

/** Validate with the Auth server. Used by API routes (proxy is skipped) and first-login create. */
const fetchAuthUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Session user id for this request. Prefers the proxy header (already
 * validated via `getUser()`) so RSC pages skip a second Auth round-trip.
 */
const getAuthUserId = cache(async (): Promise<string | null> => {
  const headerStore = await headers();
  const fromProxy = parseVaultedUserId(headerStore.get(VAULTED_USER_ID_HEADER));
  if (fromProxy) return fromProxy;

  const user = await fetchAuthUser();
  return user?.id ?? null;
});

async function createProfileForUser(user: User): Promise<Profile> {
  const base = usernameFromUser(user);
  const avatarUrl = avatarFromUser(user);
  let username = base;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [created] = await db
        .insert(profiles)
        .values({
          id: user.id,
          username,
          avatarUrl,
          onboardingCompleted: false,
          isDeveloper: isBootstrapDeveloperUsername(username),
        })
        .returning();
      await db
        .insert(binders)
        .values({ userId: user.id })
        .onConflictDoNothing();
      return created;
    } catch {
      // Navbar + page can race on first OAuth login — if the row exists, use it.
      const raced = await db.query.profiles.findFirst({
        where: eq(profiles.id, user.id),
      });
      if (raced) return raced;

      username = `${base.slice(0, 16)}${Math.floor(Math.random() * 9000) + 1000}`;
    }
  }

  const fallback = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  });
  if (fallback) return fallback;

  throw new Error("Could not allocate a username");
}

/**
 * Fetch the profile for the current session, creating it on first login.
 * Wrapped in React `cache()` so layout + page only hit DB once per request.
 */
export const getOrCreateProfile = cache(async (): Promise<Profile | null> => {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });
  if (existing) return existing;

  const user = await fetchAuthUser();
  if (!user) return null;
  return createProfileForUser(user);
});

export const getSessionUser = cache(async () => {
  const id = await getAuthUserId();
  return id ? { id } : null;
});

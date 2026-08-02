import { db } from "@/db";
import { binders, profiles, type Profile } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

/** Fetch the profile for the current session, creating it on first login. */
export async function getOrCreateProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  });
  if (existing) return existing;

  // Ensure a unique username by suffixing a discriminator on collision.
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
        })
        .returning();
      await db
        .insert(binders)
        .values({ userId: user.id })
        .onConflictDoNothing();
      return created;
    } catch {
      username = `${base}${Math.floor(Math.random() * 9000) + 1000}`;
    }
  }
  throw new Error("Could not allocate a username");
}

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

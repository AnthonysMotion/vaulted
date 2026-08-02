"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/game/profile";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CompleteOnboardingInput = {
  favouritePokemon?: string;
  bio?: string;
  /** Where to land after finishing. Defaults to trainer pack picker. */
  next?: string;
};

export async function completeOnboarding(input: CompleteOnboardingInput = {}) {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/login?next=/onboarding");

  const favouritePokemon = input.favouritePokemon?.trim().slice(0, 40);
  const bio = input.bio?.trim().slice(0, 280);

  await db
    .update(profiles)
    .set({
      onboardingCompleted: true,
      ...(favouritePokemon ? { favouritePokemon } : {}),
      ...(bio ? { bio } : {}),
    })
    .where(eq(profiles.id, profile.id));

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath(`/profile/${profile.username}`);
  revalidatePath("/account");

  const next =
    input.next && input.next.startsWith("/") && !input.next.startsWith("//")
      ? input.next
      : "/open-pack?mode=trainer";

  redirect(next);
}

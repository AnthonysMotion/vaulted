import { redirect } from "next/navigation";
import type { Profile } from "@/db/schema";

export function needsOnboarding(profile: Profile | null | undefined): boolean {
  return Boolean(profile && !profile.onboardingCompleted);
}

/** Send incomplete trainers to the walkthrough. */
export function redirectIfNeedsOnboarding(profile: Profile | null | undefined) {
  if (needsOnboarding(profile)) {
    redirect("/onboarding");
  }
}

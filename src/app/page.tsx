import { LandingExperience } from "@/components/home/landing";
import { getOrCreateProfile } from "@/lib/game/profile";
import { needsOnboarding } from "@/lib/game/onboarding";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const profile = await getOrCreateProfile().catch(() => null);
  if (profile) {
    redirect(needsOnboarding(profile) ? "/onboarding" : "/dashboard");
  }

  return (
    <main className="w-full flex-1">
      <LandingExperience signedIn={false} />
    </main>
  );
}

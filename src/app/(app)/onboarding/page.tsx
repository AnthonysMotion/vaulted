import { redirect } from "next/navigation";
import { getOrCreateProfile } from "@/lib/game/profile";
import { DAILY_PACK_LIMIT } from "@/lib/game/open-pack";
import { OnboardingFlow } from "@/components/onboarding-flow";

export const metadata = { title: "Getting started" };

export default async function OnboardingPage() {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/login?next=/onboarding");
  if (profile.onboardingCompleted) redirect("/dashboard");

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-72 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]"
      />
      <OnboardingFlow
        username={profile.username}
        dailyPackLimit={DAILY_PACK_LIMIT}
        initialFavouritePokemon={profile.favouritePokemon ?? ""}
        initialBio={profile.bio ?? ""}
      />
    </div>
  );
}

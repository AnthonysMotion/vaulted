import { redirect } from "next/navigation";
import { getOrCreateProfile } from "@/lib/game/profile";
import { DAILY_PACK_LIMIT } from "@/lib/game/constants";
import { OnboardingFlow } from "@/components/onboarding-flow";

export const metadata = { title: "Getting started" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/login?next=/onboarding");
  if (profile.onboardingCompleted) redirect("/dashboard");

  return (
    <div className="relative">
      <OnboardingFlow
        username={profile.username}
        dailyPackLimit={DAILY_PACK_LIMIT}
        initialFavouritePokemon={profile.favouritePokemon ?? ""}
        initialBio={profile.bio ?? ""}
      />
    </div>
  );
}

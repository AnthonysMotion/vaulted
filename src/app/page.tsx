import { LandingExperience } from "@/components/home/landing";
import { getSessionUser } from "@/lib/game/profile";

export default async function LandingPage() {
  const user = await getSessionUser();
  return (
    <main className="w-full flex-1">
      <LandingExperience signedIn={Boolean(user)} />
    </main>
  );
}

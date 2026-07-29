import { LandingExperience } from "@/components/home/landing";
import { getSessionUser } from "@/lib/game/profile";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="w-full flex-1">
      <LandingExperience signedIn={false} />
    </main>
  );
}

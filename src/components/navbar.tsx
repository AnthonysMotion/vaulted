import { getOrCreateProfile } from "@/lib/game/profile";
import { SiteHeader } from "./site-header";

export async function Navbar() {
  const profile = await getOrCreateProfile().catch(() => null);
  const homeHref = profile ? "/dashboard" : "/";

  return (
    <SiteHeader
      homeHref={homeHref}
      profile={
        profile
          ? { username: profile.username, avatarUrl: profile.avatarUrl }
          : null
      }
    />
  );
}

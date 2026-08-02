import Link from "next/link";
import { getOrCreateProfile } from "@/lib/game/profile";
import { ProfileMenu } from "./profile-menu";
import { MobileNav } from "./mobile-nav";

const NAV_LINKS = [
  { href: "/open-pack", label: "Packs" },
  { href: "/collection", label: "Collection" },
  { href: "/sets", label: "Sets" },
];

const AUTHED_NAV_LINKS = [
  { href: "/achievements", label: "Achievements" },
  { href: "/friends", label: "Friends" },
  { href: "/feed", label: "Feed" },
];

const glass =
  "flex items-center rounded-lg border border-white/10 bg-black/40 backdrop-blur-md px-1";
const glassBar = `${glass} h-10`;
const chip =
  "inline-flex h-8 items-center rounded-md px-4 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white";
const solid =
  "inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-xs font-bold text-black transition-colors hover:bg-zinc-200";

export async function Navbar() {
  const profile = await getOrCreateProfile().catch(() => null);
  const navLinks = profile ? [...NAV_LINKS, ...AUTHED_NAV_LINKS] : NAV_LINKS;
  const homeHref = profile ? "/dashboard" : "/";

  return (
    <>
      {/* Desktop — top */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 hidden px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] md:block">
        <div className="pointer-events-auto mx-auto flex max-w-[1200px] items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={homeHref} className={solid}>
              Vaulted
            </Link>

            <nav className={glassBar}>
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={chip}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className={glassBar}>
              <Link href="/open-pack" className={chip}>
                Open pack
              </Link>

              {profile ? (
                <ProfileMenu
                  username={profile.username}
                  avatarUrl={profile.avatarUrl}
                />
              ) : null}
            </div>

            {!profile && (
              <Link href="/login" className={solid}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile — bottom */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[260] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
        <div className="pointer-events-auto mx-auto max-w-[1200px]">
          <MobileNav
            homeHref={homeHref}
            links={navLinks}
            profile={
              profile
                ? { username: profile.username, avatarUrl: profile.avatarUrl }
                : null
            }
          />
        </div>
      </div>
    </>
  );
}

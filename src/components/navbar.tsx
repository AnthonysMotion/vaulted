import Link from "next/link";
import { getOrCreateProfile } from "@/lib/game/profile";
import { ProfileMenu } from "./profile-menu";

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
  "flex items-center rounded-lg border border-white/10 bg-black/30 backdrop-blur-md px-1";
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
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 pointer-events-none">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          <Link href={homeHref} className={solid}>
            Vaulted
          </Link>

          <nav className={`hidden md:flex ${glassBar}`}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={chip}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className={`hidden sm:flex ${glassBar}`}>
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
            <Link href="/login" className={`hidden sm:flex ${solid}`}>
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <nav className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
        <div className={`mx-auto flex max-w-[1200px] justify-between gap-1 p-1 shadow-2xl ${glass}`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-w-0 flex-1 items-center justify-center rounded-md px-2 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span className="truncate">{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

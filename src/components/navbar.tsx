import Link from "next/link";
import { getOrCreateProfile } from "@/lib/game/profile";
import { SignOutButton } from "./sign-out-button";

const NAV_LINKS = [
  { href: "/open-pack", label: "Packs" },
  { href: "/collection", label: "Collection" },
  { href: "/sets", label: "Sets" },
  { href: "/friends", label: "Friends" },
  { href: "/feed", label: "Feed" },
];

export async function Navbar() {
  const profile = await getOrCreateProfile().catch(() => null);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4 pointer-events-none">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 pointer-events-auto">
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            className="mwg-label inline-flex h-[50px] items-center rounded-full glass-dark px-6 text-white shadow-lg transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
          >
            Vaulted
          </Link>

          <nav className="flex items-center rounded-full glass px-1.5 py-1.5 shadow-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="mwg-label rounded-full px-3.5 py-2.5 text-foreground transition-colors hover:bg-white/40"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link
          href="/"
          className="mwg-label rounded-full glass-dark px-4 py-3 text-white shadow-lg md:hidden pointer-events-auto"
        >
          Vaulted
        </Link>

        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/open-pack"
            className="mwg-label inline-flex h-[50px] items-center rounded-full glass-primary px-6 text-ink transition-all hover:scale-[1.02] hover:brightness-105 active:scale-[0.98] shadow-md"
          >
            Open pack
          </Link>

          {profile ? (
            <Link
              href="/dashboard"
              className="hidden h-[50px] items-center gap-2 rounded-full glass-dark px-4 text-white transition-all hover:scale-[1.02] hover:bg-dark-grey/60 sm:inline-flex shadow-md"
              title={profile.username}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-ink">
                {profile.level}
              </span>
              <span className="mwg-label max-w-[7rem] truncate normal-case tracking-normal">
                {profile.username}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="mwg-label hidden h-[50px] items-center rounded-full glass px-5 text-foreground shadow-sm transition-all hover:scale-[1.02] hover:bg-white/40 sm:inline-flex"
            >
              Sign in
            </Link>
          )}

          {profile && (
            <div className="hidden sm:block">
              <SignOutButton />
            </div>
          )}
        </div>
      </div>

      <nav className="mx-auto mt-2 flex max-w-[1200px] gap-1 overflow-x-auto pb-1 md:hidden pointer-events-auto">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="mwg-label-s whitespace-nowrap rounded-full glass px-3 py-2 text-foreground shadow-sm transition-colors hover:bg-white/40"
          >
            {link.label}
          </Link>
        ))}
        {profile ? (
          <Link
            href="/dashboard"
            className="mwg-label-s whitespace-nowrap rounded-full glass-dark px-3 py-2 text-white transition-colors hover:bg-dark-grey/60 shadow-md"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="mwg-label-s whitespace-nowrap rounded-full glass-dark px-3 py-2 text-white transition-colors hover:bg-dark-grey/60 shadow-md"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}

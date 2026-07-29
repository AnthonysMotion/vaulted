import Link from "next/link";
import { getOrCreateProfile } from "@/lib/game/profile";
import { SignOutButton } from "./sign-out-button";

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

export async function Navbar() {
  const profile = await getOrCreateProfile().catch(() => null);
  const navLinks = profile ? [...NAV_LINKS, ...AUTHED_NAV_LINKS] : NAV_LINKS;
  const homeHref = profile ? "/dashboard" : "/";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 pointer-events-none">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          <Link
            href={homeHref}
            className="flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-black shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Vaulted
          </Link>

          <nav className="hidden items-center rounded-lg border border-zinc-800 bg-black/80 backdrop-blur-md px-1 py-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:text-white hover:bg-zinc-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/open-pack"
            className="flex h-10 items-center justify-center rounded-lg border border-zinc-800 bg-black px-5 text-sm font-medium text-white transition-all hover:bg-zinc-900 active:scale-[0.98] shadow-md"
          >
            Open pack
          </Link>

          {profile ? (
            <details className="relative hidden sm:block">
              <summary className="flex h-10 cursor-pointer list-none items-center gap-3 rounded-lg border border-zinc-800 bg-black px-4 text-sm font-medium text-white transition-all hover:bg-zinc-900 shadow-md">
                <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-md border border-zinc-700 bg-zinc-950">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="h-full w-full rounded-md object-cover"
                    />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full bg-white" />
                  )}
                </span>
                <span className="truncate max-w-[100px]">{profile.username}</span>
                <span className="text-xs text-zinc-500">▾</span>
              </summary>
              <div className="absolute right-0 mt-2 min-w-48 overflow-hidden rounded-xl border border-zinc-800 bg-black/95 p-1 shadow-2xl backdrop-blur-md">
                <Link
                  href="/dashboard"
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
                >
                  Dashboard
                </Link>
                <Link
                  href={`/profile/${profile.username}`}
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
                >
                  Profile
                </Link>
                <Link
                  href="/account"
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
                >
                  Edit account
                </Link>
              </div>
            </details>
          ) : (
            <Link
              href="/login"
              className="hidden h-10 items-center justify-center rounded-lg bg-white px-5 text-sm font-bold text-black transition-all hover:bg-white/90 sm:flex"
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

      {/* Mobile Nav */}
      <nav className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-1 rounded-2xl border border-zinc-800 bg-black/95 p-2 shadow-2xl backdrop-blur-md">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-w-0 flex-1 items-center justify-center rounded-xl px-2 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
            >
              <span className="truncate">{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

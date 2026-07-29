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
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 pointer-events-none">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-black shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Vaulted
          </Link>

          <nav className="hidden items-center rounded-lg border border-zinc-800 bg-black/80 backdrop-blur-md px-1 py-1 md:flex">
            {NAV_LINKS.map((link) => (
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
            <Link
              href="/dashboard"
              className="hidden h-10 items-center gap-3 rounded-lg border border-zinc-800 bg-black px-4 text-sm font-medium text-white transition-all hover:bg-zinc-900 sm:flex shadow-md"
              title={profile.username}
            >
              <span className="grid h-6 w-6 place-items-center rounded-md bg-white text-[10px] font-black text-black">
                {profile.level}
              </span>
              <span className="truncate max-w-[100px]">{profile.username}</span>
            </Link>
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
      <nav className="mx-auto mt-3 flex max-w-[1200px] gap-1 overflow-x-auto pb-1 md:hidden pointer-events-auto no-scrollbar">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-lg border border-zinc-800 bg-black/80 backdrop-blur-md px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

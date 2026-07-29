import Link from "next/link";
import { getOrCreateProfile } from "@/lib/game/profile";
import { SignOutButton } from "./sign-out-button";
import { LinkButton } from "./ui";

const NAV_LINKS = [
  { href: "/open-pack", label: "Open Packs" },
  { href: "/collection", label: "Collection" },
  { href: "/sets", label: "Sets" },
  { href: "/friends", label: "Friends" },
  { href: "/feed", label: "Feed" },
];

export async function Navbar() {
  const profile = await getOrCreateProfile().catch(() => null);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-red-500 via-white to-white text-sm shadow-[0_0_16px_rgba(239,68,68,0.4)]">
            ⬤
          </span>
          <span>
            Vaulted<span className="text-primary">TCG</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {profile ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm hover:border-primary/50"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {profile.level}
                </span>
                <span className="max-w-[10rem] truncate font-medium">
                  {profile.username}
                </span>
              </Link>
              <SignOutButton />
            </>
          ) : (
            <LinkButton href="/login">Sign in</LinkButton>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-2 py-1 md:hidden">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-muted hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

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

function RollLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="nav-roll">
      <span>
        <span>{children}</span>
        <span>{children}</span>
      </span>
    </span>
  );
}

export async function Navbar() {
  const profile = await getOrCreateProfile().catch(() => null);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3">
        {/* Left: floating link pill */}
        <nav className="hidden items-center rounded-full bg-surface px-1.5 py-1.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] md:flex">
          <Link
            href="/"
            className="group mwg-label rounded-full px-3.5 py-2.5 text-foreground transition-colors hover:bg-surface-2"
          >
            <RollLabel>Vaulted</RollLabel>
          </Link>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group mwg-label rounded-full px-3.5 py-2.5 text-foreground transition-colors hover:bg-surface-2"
            >
              <RollLabel>{link.label}</RollLabel>
            </Link>
          ))}
        </nav>

        {/* Mobile brand */}
        <Link
          href="/"
          className="mwg-label rounded-full bg-surface px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)] md:hidden"
        >
          Vaulted
        </Link>

        {/* Right: CTA + account */}
        <div className="flex items-center gap-2">
          <Link
            href="/open-pack"
            className="group mwg-label inline-flex h-[50px] items-center gap-2 rounded-full bg-primary px-6 text-ink transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <RollLabel>Open pack</RollLabel>
            <span aria-hidden className="text-base leading-none">
              →
            </span>
          </Link>

          {profile ? (
            <Link
              href="/dashboard"
              className="group hidden h-[50px] items-center gap-2 rounded-full bg-anthracite px-4 text-white sm:inline-flex"
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
              className="group mwg-label hidden h-[50px] items-center rounded-full bg-surface px-5 text-foreground shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:inline-flex hover:bg-white"
            >
              <RollLabel>Sign in</RollLabel>
            </Link>
          )}

          {profile && (
            <div className="hidden sm:block">
              <SignOutButton />
            </div>
          )}
        </div>
      </div>

      {/* Mobile link row */}
      <nav className="mx-auto mt-2 flex max-w-[1200px] gap-1 overflow-x-auto pb-1 md:hidden">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="mwg-label-s whitespace-nowrap rounded-full bg-surface px-3 py-2 text-foreground shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          >
            {link.label}
          </Link>
        ))}
        {profile ? (
          <Link
            href="/dashboard"
            className="mwg-label-s whitespace-nowrap rounded-full bg-anthracite px-3 py-2 text-white"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="mwg-label-s whitespace-nowrap rounded-full bg-anthracite px-3 py-2 text-white"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}

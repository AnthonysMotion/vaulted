import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ScrollToTop } from "@/components/scroll-to-top";
import { VAULTED_LOGO_SRC, VaultedWordmark } from "@/components/vaulted-logo";

/** Closest widely-available stand-in for Sui’s TWK Everett. */
const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Stand-in for TWK Everett Mono (category labels, UI meta). */
const mono = IBM_Plex_Mono({
  variable: "--font-mono-label",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VaultedTCG — Pokémon Pack Opening Simulator",
    template: "%s · VaultedTCG",
  },
  description:
    "Open Pokémon TCG booster packs with realistic pull rates, build your collection, showcase your binder and compete with friends. A non-profit fan project.",
  icons: {
    icon: VAULTED_LOGO_SRC,
    apple: VAULTED_LOGO_SRC,
  },
};

function NavbarFallback() {
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[260]">
        <div className="h-10 w-full bg-accent" />
        <div className="px-4 pt-3 sm:px-5">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between bg-surface px-4">
            <div className="h-5 w-28 animate-pulse bg-surface-2" />
            <div className="hidden h-5 w-80 animate-pulse bg-surface-2/70 lg:block" />
            <div className="h-9 w-28 animate-pulse bg-accent" />
          </div>
        </div>
      </div>
      <div aria-hidden className="h-[7.25rem]" />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground selection:bg-accent selection:text-white">
        <Suspense fallback={<NavbarFallback />}>
          <Navbar />
        </Suspense>
        {children}
        <ScrollToTop />
        <footer className="border-t border-border bg-background px-[calc(1rem+1.031em)] pb-12 pt-10 sm:px-[calc(1.25rem+1.031em)] sm:pt-12">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <VaultedWordmark
                  logoSize={40}
                  label="Vaulted"
                  textClassName="text-xl font-medium tracking-[-0.03em] text-white"
                />
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-2">
                  Non-profit fan project. Pokémon and Pokémon TCG are trademarks of
                  Nintendo, Creatures Inc. and GAME FREAK inc.
                </p>
              </div>
              <nav className="flex flex-col items-start gap-3 sm:items-end">
                <Link
                  href="/about"
                  className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-category transition-colors hover:text-white"
                >
                  About
                </Link>
                <p className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted-2">
                  Card data via{" "}
                  <a
                    href="https://github.com/PokemonTCG/pokemon-tcg-data"
                    className="text-muted underline underline-offset-4 transition-colors hover:text-white"
                  >
                    pokemon-tcg-data
                  </a>
                </p>
              </nav>
            </div>
            <p className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted-2">
              This project is still under development.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

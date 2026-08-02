import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

/** Closest widely-available stand-in for MWG's LayGrotesk. */
const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Closest stand-in for PP Neue Montreal Mono (uppercase UI labels). */
const mono = IBM_Plex_Mono({
  variable: "--font-mono-label",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "VaultedTCG — Pokémon Pack Opening Simulator",
    template: "%s · VaultedTCG",
  },
  description:
    "Open Pokémon TCG booster packs with realistic pull rates, build your collection, showcase your binder and compete with friends. A non-profit fan project.",
};

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
      <body className="flex min-h-full flex-col bg-black text-white selection:bg-white selection:text-black">
        <Navbar />
        {children}
        <footer className="border-t border-zinc-900 bg-black px-5 pb-28 pt-10 sm:px-10 sm:pt-12 md:pb-12">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xl font-bold tracking-tighter text-white">VaultedTCG</div>
                <p className="mt-4 max-w-sm text-xs leading-relaxed text-zinc-500">
                  Non-profit fan project. Pokémon and Pokémon TCG are trademarks of
                  Nintendo, Creatures Inc. and GAME FREAK inc.
                </p>
              </div>
              <nav className="flex flex-col items-start gap-3 sm:items-end">
                <Link
                  href="/about"
                  className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 underline underline-offset-4 hover:text-white transition-colors"
                >
                  About
                </Link>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  Card data via{" "}
                  <a
                    href="https://github.com/PokemonTCG/pokemon-tcg-data"
                    className="text-zinc-400 underline underline-offset-4 hover:text-white transition-colors"
                  >
                    pokemon-tcg-data
                  </a>
                </p>
              </nav>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-700">
              This project is still under development.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

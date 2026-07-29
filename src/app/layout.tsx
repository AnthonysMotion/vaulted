import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted">
          VaultedTCG is a non-profit fan project. Pokémon and Pokémon TCG are trademarks
          of Nintendo, Creatures Inc. and GAME FREAK inc. Card data via the community{" "}
          <a
            href="https://github.com/PokemonTCG/pokemon-tcg-data"
            className="underline hover:text-foreground"
          >
            pokemon-tcg-data
          </a>{" "}
          project.
        </footer>
      </body>
    </html>
  );
}

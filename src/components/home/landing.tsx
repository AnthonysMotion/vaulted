"use client";

import { LinkButton, SectionEyebrow, Card } from "@/components/ui";
import Grainient from "./Grainient";

const STATS = [
  { value: 20, suffix: "k+", label: "Cards in the database" },
  { value: 174, suffix: "", label: "Sets to open" },
  { value: 3, suffix: "", label: "Packs a day" },
  { value: 0, suffix: "", label: "Sandbox packs", display: "∞" },
];

/** Shared inner container so full-bleed sections align to the same grid. */
const CONTAINER = "mx-auto w-full max-w-[1200px] px-6 sm:px-10";

export function LandingExperience({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="relative w-full bg-black text-white selection:bg-white selection:text-black">
      {/* Hero Section */}
      <section className="hero relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-black">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Grainient
            className="absolute inset-0"
            color1="#000000"
            color2="#111111"
            color3="#000000"
            timeSpeed={0.2}
            colorBalance={0}
            warpStrength={0.5}
            warpFrequency={2}
            warpSpeed={1}
            warpAmplitude={30}
            blendAngle={45}
            blendSoftness={0.1}
            rotationAmount={100}
            noiseScale={1}
            grainAmount={0.05}
            grainScale={1.5}
            grainAnimated={true}
            contrast={1.2}
            gamma={0.8}
            saturation={0.5}
            centerX={0}
            centerY={0}
            zoom={1.1}
          />
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        </div>

        <div className={`${CONTAINER} relative`}>
          <div className="flex w-full max-w-[1000px] flex-col items-center text-center">
            <span className="hero-badge text-[10px] font-bold uppercase tracking-[0.3em] inline-flex rounded-full border border-zinc-800 bg-black/50 px-4 py-2 text-zinc-500 backdrop-blur-md mb-8 drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              Fan project · Free to play
            </span>
            <h1 className="hero-title title-xl font-black tracking-tighter leading-[0.9] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              The Next Pack<br />Could Change<br />Everything
            </h1>
            <p className="hero-copy mt-10 max-w-2xl text-lg sm:text-xl leading-relaxed text-zinc-400 drop-shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
              Vaulted is a Pokémon TCG pack simulator. Rip boosters with real slot odds,
              grow a collection, and share pulls with friends.
            </p>
            <div className="hero-cta mt-12 flex flex-wrap items-center justify-center gap-4 text-white">
              <LinkButton href="/open-pack" variant="primary" className="h-12 px-8 text-sm font-bold">
                Open a pack <span aria-hidden className="ml-2 font-normal opacity-50">→</span>
              </LinkButton>
              {!signedIn ? (
                <LinkButton href="/login" variant="dark" className="h-12 px-8 text-sm font-bold bg-zinc-900 border-zinc-800">
                  Sign up
                </LinkButton>
              ) : (
                <LinkButton href="/dashboard" variant="dark" className="h-12 px-8 text-sm font-bold bg-zinc-900 border-zinc-800">
                  Go to dashboard
                </LinkButton>
              )}
            </div>
            <div className="mt-12 flex items-center gap-3 text-zinc-600 drop-shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              <div className="h-px w-8 bg-zinc-800" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                No account needed to try it
              </p>
              <div className="h-px w-8 bg-zinc-800" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats relative z-10 border-y border-zinc-900 bg-black py-16">
        <div className={CONTAINER}>
          <div className="grid grid-cols-2 gap-px bg-zinc-900 border border-zinc-900 rounded-2xl overflow-hidden lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="stat-card group bg-black p-10 transition-all hover:bg-zinc-950"
              >
                <div className="stat-value text-4xl font-bold tracking-tighter text-white mb-2">
                  {stat.display ?? stat.value.toLocaleString() + stat.suffix}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="manifesto relative py-32 overflow-hidden border-b border-zinc-900">
        <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
        <div className={`${CONTAINER} grid gap-20 lg:grid-cols-[1fr_1.1fr] lg:items-center`}>
          <div className="manifesto-content">
            <SectionEyebrow>How packs work</SectionEyebrow>
            <h2 className="title-l font-bold tracking-tighter leading-[0.9] text-white">
              Built like the<br />real boosters.
            </h2>
            <p className="mt-10 text-xl text-zinc-400 leading-relaxed max-w-lg">
              Each set uses the same slot layout as physical packs from that era.
              Commons, reverses, rares, the works. What you pull is what the odds allow.
            </p>
            <div className="mt-12 flex gap-4">
              <div className="flex flex-col gap-1 text-white">
                <span className="text-2xl font-bold">1999–now</span>
                <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Set coverage</span>
              </div>
              <div className="w-px h-10 bg-zinc-900" />
              <div className="flex flex-col gap-1 text-white">
                <span className="text-2xl font-bold">20k+</span>
                <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Cards available</span>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <Card variant="surface" className="p-8 border-zinc-800 hover:border-zinc-700 transition-colors group">
              <h3 className="text-lg font-bold mb-3 text-white group-hover:text-white transition-colors">Era-correct packs</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Base Set holos, EX-era reverses, modern illustration rares.
                Each expansion follows the layout from when it actually released.
              </p>
            </Card>
            <Card variant="surface" className="p-8 border-zinc-800 hover:border-zinc-700 transition-colors group text-white">
              <h3 className="text-lg font-bold mb-3 text-white group-hover:text-white transition-colors">A collection that sticks</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Sign in and every pull is saved. Level up, chase achievements,
                and keep a binder other people can actually look through.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Modes Section */}
      <section className="modes relative py-32 bg-black border-b border-zinc-900 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
        <div className={`${CONTAINER} relative`}>
          <div className="mb-20">
            <SectionEyebrow>Two ways to play</SectionEyebrow>
            <h2 className="title-l font-bold tracking-tighter text-white">
              Sandbox or Trainer.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="mode-panel bg-zinc-950 border border-zinc-900 rounded-xl p-10 transition-all hover:border-zinc-700 flex flex-col justify-between min-h-[400px] shadow-2xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-6 block">01 · Sandbox</span>
                <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Just open packs.</h3>
                <ul className="space-y-4">
                  {[
                    "As many packs as you want",
                    "No account required",
                    "Same reveal flow as Trainer",
                    "Keeps history for the session",
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-zinc-400 text-sm font-medium">
                      <div className="h-1.5 w-1.5 bg-zinc-700 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <LinkButton href="/open-pack?mode=sandbox" variant="dark" className="w-fit mt-12 h-11 px-8 text-xs font-bold uppercase tracking-widest">
                Try sandbox
              </LinkButton>
            </div>

            <div className="mode-panel bg-zinc-950 border border-zinc-900 rounded-xl p-10 transition-all hover:border-zinc-700 flex flex-col justify-between min-h-[400px] shadow-2xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-6 block text-white/50">02 · Trainer</span>
                <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Keep what you pull.</h3>
                <ul className="space-y-4">
                  {[
                    "A few packs each day",
                    "XP and levels",
                    "Cards saved to your collection",
                    "Share pulls with friends",
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-zinc-400 text-sm font-medium">
                      <div className="h-1.5 w-1.5 bg-zinc-700 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <LinkButton
                href={signedIn ? "/open-pack?mode=trainer" : "/login"}
                variant="primary"
                className="w-fit mt-12 h-11 px-8 text-xs font-bold uppercase tracking-widest text-black"
              >
                {signedIn ? "Open packs" : "Create an account"}
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* Finale Section */}
      <section className="finale relative py-32 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
        <div className={`${CONTAINER} finale-content relative text-center flex flex-col items-center`}>
          <SectionEyebrow>The sets</SectionEyebrow>
          <h2 className="title-xl font-black tracking-tighter leading-[0.8] text-white mt-8">
            From Base Set<br />to whatever just dropped.
          </h2>
          <p className="mt-12 max-w-2xl text-xl text-zinc-400 leading-relaxed">
            Pick a set, open a pack, and see what lands. If you want to show
            someone a pull later, Trainer mode saves it for you.
          </p>
          <div className="mt-16 flex flex-col items-center gap-8">
            <LinkButton href="/sets" variant="primary" className="h-14 px-12 text-lg font-bold text-black">
              Browse sets
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Footer adjustments in layout, but adding a spacer here */}
      <div className="h-32 border-t border-zinc-900" />
    </div>
  );
}

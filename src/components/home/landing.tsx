"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LinkButton, SectionEyebrow, Card } from "@/components/ui";
import WebThreads from "./WebThreads";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const STATS = [
  { value: 20, suffix: "k+", label: "Cards in the database" },
  { value: 174, suffix: "", label: "Sets to open" },
  { value: 3, suffix: "", label: "Packs a day" },
  { value: 0, suffix: "", label: "Sandbox packs", display: "∞" },
];

/**
 * Match SiteHeader chrome:
 * outer `px-4 sm:px-5` + `max-w-[1400px]` + bar `px-[1.031em]`.
 */
const CONTAINER =
  "mx-auto w-full max-w-[1400px] px-[calc(1rem+1.031em)] sm:px-[calc(1.25rem+1.031em)]";

export function LandingExperience({ signedIn }: { signedIn: boolean }) {
  const heroRef = useRef<HTMLElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const items = gsap.utils.toArray<HTMLElement>(".hero-anim");

      if (!items.length) return;

      gsap.set(items, { opacity: 0, y: reduceMotion ? 0 : 28 });

      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: reduceMotion ? 0.01 : 1.05,
        stagger: reduceMotion ? 0 : 0.14,
        ease: "power3.out",
        delay: reduceMotion ? 0 : 0.12,
      });

      if (reduceMotion || !heroCopyRef.current) return;

      const scroll = {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1.6,
      };

      gsap.to(heroCopyRef.current, {
        yPercent: -55,
        y: -180,
        scale: 0.88,
        opacity: 0,
        ease: "none",
        scrollTrigger: scroll,
      });

      if (heroBgRef.current) {
        gsap.to(heroBgRef.current, {
          yPercent: 8,
          scale: 1.03,
          ease: "none",
          scrollTrigger: scroll,
        });
      }
    },
    { scope: heroRef },
  );

  return (
    <div className="relative w-full bg-background text-foreground selection:bg-accent selection:text-white">
      <section
        ref={heroRef}
        className="hero relative flex min-h-[100svh] -mt-[var(--site-header-offset)] items-center justify-center overflow-hidden bg-background"
      >
        <div
          ref={heroBgRef}
          aria-hidden
          className="pointer-events-none absolute inset-[-12%] will-change-transform"
        >
          <WebThreads
            className="absolute inset-0"
            color1="#298dff"
            color2="#298dff"
            color3="#ffffff"
            spread={0.6}
            threadCount={7}
            speed={0.04}
            frequency={1}
            falloff={0.5}
            thickness={1.15}
            brightness={1}
            opacity={0.8}
            mouseStrength={0}
            mouseInteraction={false}
          />
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/20 to-background" />
        </div>

        <div className={`${CONTAINER} relative`}>
          <div
            ref={heroCopyRef}
            className="mx-auto flex w-full max-w-[1000px] flex-col items-center text-center will-change-transform"
          >
            <h1 className="hero-anim hero-title title-xl text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)]">
              The Next Pack Could Change Everything
            </h1>
            <p className="hero-anim hero-copy mt-10 max-w-2xl text-lg leading-relaxed text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.55)] sm:text-xl">
              Vaulted is a Pokémon TCG pack simulator. Rip boosters with real slot odds,
              grow a collection, and share pulls with friends.
            </p>
            <div className="hero-anim hero-cta mt-12 flex flex-wrap items-center justify-center gap-3 text-white">
              <LinkButton href="/open-pack" variant="primary" className="h-12 px-8 text-sm">
                Open a pack <span aria-hidden className="ml-2 font-normal opacity-70">→</span>
              </LinkButton>
              {!signedIn ? (
                <LinkButton href="/login" variant="dark" className="h-12 px-8 text-sm">
                  Sign up
                </LinkButton>
              ) : (
                <LinkButton href="/dashboard" variant="dark" className="h-12 px-8 text-sm">
                  Go to dashboard
                </LinkButton>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats relative z-10 border-y border-border bg-background py-16">
        <div className={CONTAINER}>
          <div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="stat-card group bg-background p-10 transition-colors hover:bg-surface"
              >
                <div className="stat-value mb-2 text-4xl font-medium tracking-[-0.04em] text-white">
                  {stat.display ?? stat.value.toLocaleString() + stat.suffix}
                </div>
                <div className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted transition-colors group-hover:text-category">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="manifesto relative overflow-hidden border-b border-border py-32">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-10" />
        <div className={`${CONTAINER} grid gap-20 lg:grid-cols-[1fr_1.1fr] lg:items-center`}>
          <div className="manifesto-content">
            <SectionEyebrow>How packs work</SectionEyebrow>
            <h2 className="title-l text-white">
              Built like the
              <br />
              real boosters.
            </h2>
            <p className="mt-10 max-w-lg text-xl leading-relaxed text-muted-2">
              Each set uses the same slot layout as physical packs from that era.
              Commons, reverses, rares, the works. What you pull is what the odds allow.
            </p>
            <div className="mt-12 flex gap-4">
              <div className="flex flex-col gap-1 text-white">
                <span className="text-2xl font-medium tracking-[-0.03em]">1999–now</span>
                <span className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted">
                  Set coverage
                </span>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex flex-col gap-1 text-white">
                <span className="text-2xl font-medium tracking-[-0.03em]">20k+</span>
                <span className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted">
                  Cards available
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <Card
              variant="surface"
              className="group border-border p-8 transition-colors hover:border-muted"
            >
              <h3 className="mb-3 text-lg font-medium tracking-[-0.02em] text-white">
                Era-correct packs
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                Base Set holos, EX-era reverses, modern illustration rares.
                Each expansion follows the layout from when it actually released.
              </p>
            </Card>
            <Card
              variant="surface"
              className="group border-border p-8 transition-colors hover:border-muted"
            >
              <h3 className="mb-3 text-lg font-medium tracking-[-0.02em] text-white">
                A collection that sticks
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                Sign in and every pull is saved. Level up, chase achievements,
                and keep a binder other people can actually look through.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Modes Section */}
      <section className="modes relative overflow-hidden border-b border-border bg-background py-32">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-5" />
        <div className={`${CONTAINER} relative`}>
          <div className="mb-20">
            <SectionEyebrow>Two ways to play</SectionEyebrow>
            <h2 className="title-l text-white">Sandbox or Trainer.</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="mode-panel flex min-h-[400px] flex-col justify-between border border-border bg-surface p-10 transition-colors hover:border-muted">
              <div>
                <span className="mb-6 block font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted">
                  01 · Sandbox
                </span>
                <h3 className="mb-6 text-2xl font-medium tracking-[-0.03em] text-white">
                  Just open packs.
                </h3>
                <ul className="space-y-4">
                  {[
                    "As many packs as you want",
                    "No account required",
                    "Same reveal flow as Trainer",
                    "Keeps history for the session",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-sm text-muted-2"
                    >
                      <div className="h-1.5 w-1.5 bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <LinkButton
                href="/open-pack?mode=sandbox"
                variant="dark"
                className="mt-12 h-11 w-fit px-8 font-mono text-[0.625rem] uppercase tracking-[-0.01em]"
              >
                Try sandbox
              </LinkButton>
            </div>

            <div className="mode-panel flex min-h-[400px] flex-col justify-between border border-border bg-surface p-10 transition-colors hover:border-muted">
              <div>
                <span className="mb-6 block font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-category">
                  02 · Trainer
                </span>
                <h3 className="mb-6 text-2xl font-medium tracking-[-0.03em] text-white">
                  Keep what you pull.
                </h3>
                <ul className="space-y-4">
                  {[
                    "A few packs each day",
                    "XP and levels",
                    "Cards saved to your collection",
                    "Share pulls with friends",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-sm text-muted-2"
                    >
                      <div className="h-1.5 w-1.5 bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <LinkButton
                href={signedIn ? "/open-pack?mode=trainer" : "/login"}
                variant="primary"
                className="mt-12 h-11 w-fit px-8 font-mono text-[0.625rem] uppercase tracking-[-0.01em]"
              >
                {signedIn ? "Open packs" : "Create an account"}
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* Finale Section */}
      <section className="finale relative overflow-hidden bg-background py-32 text-white">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
        <div
          className={`${CONTAINER} finale-content relative flex flex-col items-center text-center`}
        >
          <SectionEyebrow>The sets</SectionEyebrow>
          <h2 className="title-xl mt-8 text-white">
            From Base Set
            <br />
            to whatever just dropped.
          </h2>
          <p className="mt-12 max-w-2xl text-xl leading-relaxed text-muted-2">
            Pick a set, open a pack, and see what lands. If you want to show
            someone a pull later, Trainer mode saves it for you.
          </p>
          <div className="mt-16 flex flex-col items-center gap-8">
            <LinkButton href="/sets" variant="primary" className="h-14 px-12 text-lg">
              Browse sets
            </LinkButton>
          </div>
        </div>
      </section>

      <div className="h-32 border-t border-border" />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LinkButton, SectionEyebrow, Card, Badge } from "@/components/ui";
import Grainient from "./Grainient";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FEATURES = [
  {
    n: "01",
    title: "Realistic pull rates",
    body: "A pull engine built around real booster structures, community odds, and set-specific rarity pools instead of generic randomness.",
  },
  {
    n: "02",
    title: "Collections that mean something",
    body: "Every saved pull contributes to completion, duplicates, streaks, XP, levels, achievements, and the cards you can actually showcase.",
  },
  {
    n: "03",
    title: "A social collector layer",
    body: "Public binders, friends, feed reactions, and direct collection comparison turn opening packs into a shared ritual instead of a solo screen.",
  },
  {
    n: "04",
    title: "Every era feels different",
    body: "Vintage, EX, e-Card, Sword and Shield, Scarlet and Violet, and Mega Evolution each preserve their own slot logic and pacing.",
  },
];

const STATS = [
  { value: 20, suffix: "k+", label: "Cards imported" },
  { value: 174, suffix: "", label: "Expansions" },
  { value: 3, suffix: "", label: "Packs / day" },
  { value: 0, suffix: "", label: "Sandbox forever", display: "∞" },
];

/** Shared inner container so full-bleed sections align to the same grid. */
const CONTAINER = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";

function RevealLines({
  lines,
  className = "",
  lineClassName = "",
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
}) {
  return (
    <span className={className}>
      {lines.map((line) => (
        <span key={line} className="block overflow-hidden pb-[0.08em]">
          <span className={`reveal-line block will-change-transform ${lineClassName}`}>
            {line}
          </span>
        </span>
      ))}
    </span>
  );
}

export function LandingExperience({ signedIn }: { signedIn: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(
          [
            ".reveal-line",
            ".hero-copy",
            ".hero-cta > *",
            ".stat-card",
            ".feature-slide",
            ".mode-panel",
            ".manifesto-copy > *",
          ],
          { clearProps: "all", opacity: 1, y: 0, yPercent: 0 },
        );
        STATS.forEach((stat, i) => {
          const el = root.current?.querySelectorAll<HTMLElement>(".stat-value")[i];
          if (el) el.textContent = stat.display ?? `${stat.value.toLocaleString()}${stat.suffix}`;
        });
        return;
      }

      // Hero animations
      const hero = gsap.timeline({ defaults: { ease: "power4.out" } });
      hero
        .from(".hero-badge", { y: 20, opacity: 0, duration: 0.8, delay: 0.2 })
        .from(".hero-title .reveal-line", { yPercent: 100, duration: 1.2, stagger: 0.1 }, "-=0.6")
        .from(".hero-copy", { y: 20, opacity: 0, duration: 1 }, "-=0.8")
        .from(".hero-cta", { y: 20, opacity: 0, duration: 0.8 }, "-=0.8");

      // Stats counter
      document.querySelectorAll<HTMLElement>(".stat-card").forEach((card) => {
        const valueEl = card.querySelector<HTMLElement>(".stat-value");
        const target = Number(card.dataset.value ?? 0);
        const suffix = card.dataset.suffix ?? "";
        const display = card.dataset.display;
        if (!valueEl) return;

        ScrollTrigger.create({
          trigger: card,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.fromTo(
              card,
              { y: 30, opacity: 0 },
              { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
            );
            if (display) {
              valueEl.textContent = display;
              return;
            }
            const counter = { val: 0 };
            gsap.to(counter, {
              val: target,
              duration: 2,
              ease: "power2.out",
              onUpdate: () => {
                valueEl.textContent = `${Math.round(counter.val).toLocaleString()}${suffix}`;
              },
            });
          },
        });
      });

      // Manifesto animation
      gsap.from(".manifesto-content > *", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger: ".manifesto", start: "top 75%" },
      });

      // Features pinned scroll
      const slides = gsap.utils.toArray<HTMLElement>(".feature-slide");
      if (slides.length > 1) {
        gsap.set(slides, { autoAlpha: 0, y: 40, scale: 0.95 });
        gsap.set(slides[0], { autoAlpha: 1, y: 0, scale: 1 });

        const pinDistance = () => window.innerHeight * (slides.length - 1);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".features",
            start: "top top",
            end: () => `+=${pinDistance()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        slides.forEach((slide, i) => {
          if (i === 0) return;
          tl.to(
            slides[i - 1],
            { autoAlpha: 0, y: -40, scale: 0.95, duration: 0.5, ease: "power2.inOut" },
            i,
          );
          tl.fromTo(
            slide,
            { autoAlpha: 0, y: 40, scale: 0.95 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "power2.inOut" },
            i,
          );
        });
        tl.to({}, { duration: 0.5 }); // Hold at end

        gsap.to(".features-progress", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".features",
            start: "top top",
            end: () => `+=${pinDistance()}`,
            scrub: true,
          },
        });
      }

      // Mode panels animation
      gsap.from(".mode-panel", {
        y: 60,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: { trigger: ".modes", start: "top 80%" },
      });

      // Finale animation
      gsap.from(".finale-content > *", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".finale", start: "top 80%" },
      });

      document.fonts.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative w-full">
      {/* Hero Section */}
      <section className="hero relative flex min-h-[100svh] items-center justify-center overflow-hidden pt-14 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Grainient
            className="absolute inset-0"
            color1="#2a4341"
            color2="#c9fe6e"
            color3="#2a4341"
            timeSpeed={0.5}
            colorBalance={0}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background/80" />
        </div>

        <div className={`${CONTAINER} relative`}>
          <div className="flex w-full max-w-[900px] flex-col items-start text-left">
            <span className="hero-badge mwg-label-s inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-white/90 backdrop-blur-md">
              Non-profit fan project · Free forever
            </span>
            <h1 className="hero-title title-xl mt-8 font-black text-white">
              <RevealLines lines={["The Next Pack", "Could Change", "Everything."]} />
            </h1>
            <p className="hero-copy mt-8 max-w-2xl text-xl leading-relaxed text-white/80">
              A social Pokemon TCG pack-opening game with real-world pull rates,
              permanent collections, and global friend rivalry.
            </p>
            <div className="hero-cta mt-12 flex flex-wrap items-center gap-4">
              <LinkButton href="/open-pack" variant="primary" className="h-[60px] px-8 text-lg">
                Open a free pack <span aria-hidden className="ml-1">→</span>
              </LinkButton>
              {!signedIn ? (
                <LinkButton href="/login" variant="dark" className="h-[60px] px-8 text-lg">
                  Create trainer account
                </LinkButton>
              ) : (
                <LinkButton href="/dashboard" variant="secondary" className="h-[60px] px-8 text-lg">
                  Go to Dashboard
                </LinkButton>
              )}
            </div>
            <p className="mwg-label-s mt-8 text-white/50">
              Sandbox mode needs no account — jump straight in.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats -mt-20 relative z-10 sm:mt-[-5rem]">
        <div className={CONTAINER}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="stat-card group rounded-[24px] glass p-8 transition-all hover:scale-[1.02] hover:bg-white/50"
                data-value={stat.value}
                data-suffix={stat.suffix}
                data-display={stat.display ?? ""}
              >
                <div className="stat-value title-m tracking-tight font-black text-anthracite">
                  {stat.display ?? "0"}
                </div>
                <div className="mwg-label mt-2 text-muted group-hover:text-foreground transition-colors">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="manifesto relative mt-32 flex min-h-[70svh] items-center overflow-hidden py-24">
        <div className={`${CONTAINER} manifesto-content grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:items-center`}>
          <div>
            <SectionEyebrow>The Vision</SectionEyebrow>
            <h2 className="title-l mt-6 font-black leading-[0.95] tracking-tight">
              A collection that feels tangible.
            </h2>
            <p className="mt-8 text-xl leading-relaxed text-muted">
              We&apos;ve rebuilt the pack opening experience from the ground up, focusing on
              the physical sensation of the chase.
            </p>
          </div>
          <div className="manifesto-copy grid gap-6">
            <Card className="p-8">
              <h3 className="title-s mb-4">True Randomness</h3>
              <p className="text-muted leading-relaxed">
                No weighted odds. Every pack uses the exact mathematical structures of physical boosters,
                sourced from community data and historical pull rates.
              </p>
            </Card>
            <Card className="p-8">
              <h3 className="title-s mb-4">Living History</h3>
              <p className="text-muted leading-relaxed">
                From the 1999 Base Set to the latest modern expansions, every era preserves its unique
                slot logic, rarity pools, and reveal pacing.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features relative mt-12 min-h-[100svh] overflow-hidden bg-surface-2">
        <div
          className={`${CONTAINER} flex min-h-[100svh] flex-col justify-center gap-12 py-24 lg:flex-row lg:items-center lg:gap-20`}
        >
          <div className="lg:w-[45%]">
            <SectionEyebrow>Core Systems</SectionEyebrow>
            <h2 className="title-l mt-6 font-black leading-[0.95] tracking-tight">
              Built for the modern collector.
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-muted max-w-md">
              Scroll to explore the pillars that make Vaulted the ultimate platform for TCG enthusiasts.
            </p>
            <div className="mt-12 h-[3px] w-full overflow-hidden rounded-full bg-white/30">
              <div className="features-progress h-full w-full origin-left scale-x-0 bg-primary shadow-[0_0_12px_rgba(201,254,110,0.4)]" />
            </div>
          </div>

          <div className="feature-slides relative min-h-[400px] flex-1">
            {FEATURES.map((f, i) => (
              <article
                key={f.n}
                className="feature-slide absolute inset-0 flex flex-col justify-center rounded-[32px] glass p-10 sm:p-12"
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="mwg-label text-primary font-bold text-lg">{f.n}</span>
                  <Badge color="default">
                    {String(i + 1).padStart(2, "0")} / {String(FEATURES.length).padStart(2, "0")}
                  </Badge>
                </div>
                <h3 className="title-m font-bold mb-6">{f.title}</h3>
                <p className="text-lg leading-relaxed text-muted sm:text-xl">
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Modes Section */}
      <section className="modes relative flex min-h-[90svh] flex-col justify-center py-32 bg-background">
        <div className={CONTAINER}>
          <div className="mb-16 max-w-3xl">
            <SectionEyebrow>Game Modes</SectionEyebrow>
            <h2 className="title-l mt-6 font-black leading-[0.95] tracking-tight">
              Play your way.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="mode-panel group flex min-h-[450px] flex-col justify-between rounded-[32px] glass p-10 transition-all hover:bg-white/60">
              <div>
                <span className="mwg-label text-muted font-bold">01 · Simulator</span>
                <h3 className="title-m mt-6 font-black">Sandbox Mode</h3>
                <ul className="mt-10 space-y-4 text-lg text-muted">
                  <li className="flex items-center gap-3"><span className="text-primary">✦</span> Unlimited packs, no limits</li>
                  <li className="flex items-center gap-3"><span className="text-primary">✦</span> Real-time reveal animations</li>
                  <li className="flex items-center gap-3"><span className="text-primary">✦</span> No account required</li>
                  <li className="flex items-center gap-3"><span className="text-primary">✦</span> Instant screenshot sharing</li>
                </ul>
              </div>
              <LinkButton href="/open-pack?mode=sandbox" variant="secondary" className="h-14 px-8 w-fit mt-12">
                Launch Sandbox →
              </LinkButton>
            </div>

            <div className="mode-panel group flex min-h-[450px] flex-col justify-between rounded-[32px] glass-dark p-10 text-white transition-all hover:bg-black/50">
              <div>
                <span className="mwg-label text-primary font-bold">02 · RPG Progression</span>
                <h3 className="title-m mt-6 font-black text-white">Trainer Mode</h3>
                <ul className="mt-10 space-y-4 text-lg text-white/70">
                  <li className="flex items-center gap-3"><span className="text-primary">✦</span> 3 packs per day allowance</li>
                  <li className="flex items-center gap-3"><span className="text-primary">✦</span> Level up and earn achievements</li>
                  <li className="flex items-center gap-3"><span className="text-primary">✦</span> Permanent binder & collection</li>
                  <li className="flex items-center gap-3"><span className="text-primary">✦</span> Rivalry and social feed</li>
                </ul>
              </div>
              <LinkButton
                href={signedIn ? "/open-pack?mode=trainer" : "/login"}
                variant="primary"
                className="h-14 px-8 w-fit mt-12"
              >
                {signedIn ? "Open Today's Packs →" : "Sign Up Free →"}
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* Finale Section */}
      <section className="finale relative mt-12 flex min-h-[80svh] flex-col items-center justify-center overflow-hidden bg-primary py-32 text-ink">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #000 1.5px, transparent 1.5px), radial-gradient(circle at 80% 70%, #000 1.5px, transparent 1.5px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className={`${CONTAINER} finale-content relative text-center`}>
          <SectionEyebrow>The Checklist</SectionEyebrow>
          <h2 className="mt-8 font-black leading-[0.9] tracking-tighter text-6xl sm:text-8xl">
            Browse every<br />expansion.
          </h2>
          <p className="mx-auto mt-10 max-w-2xl text-xl leading-relaxed text-ink/70">
            Every set is imported, seeded, and wired into a data-driven pack system
            designed to scale with the future of the game.
          </p>
          <div className="mt-12 flex flex-col items-center gap-6">
            <LinkButton href="/sets" variant="dark" className="h-16 px-12 text-xl">
              Explore expansions
            </LinkButton>
            <p className="mwg-label-s text-ink/50">
              Or jump to{" "}
              <Link href="/sets/sv3pt5" className="font-bold underline underline-offset-4 hover:text-ink transition-colors">
                Scarlet & Violet 151
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

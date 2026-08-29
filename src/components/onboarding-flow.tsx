"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui";
import { completeOnboarding } from "@/lib/game/complete-onboarding";

type StepId = "welcome" | "modes" | "daily" | "binder" | "profile" | "ready";

type Step = {
  id: StepId;
  eyebrow: string;
  title: string;
  body: string;
  points?: string[];
};

function buildSteps(dailyPackLimit: number): Step[] {
  return [
    {
      id: "welcome",
      eyebrow: "Welcome",
      title: "You're set up as a trainer.",
      body: "Vision lets you open Pokémon TCG packs, keep what you pull, and show the good ones off. This takes a minute.",
    },
    {
      id: "modes",
      eyebrow: "Modes",
      title: "Sandbox or Trainer.",
      body: "Two ways to open packs — pick based on whether you want the cards saved.",
      points: [
        "Sandbox — unlimited packs, no account needed, nothing is saved.",
        "Trainer — packs count toward your collection, XP, streaks, and achievements.",
      ],
    },
    {
      id: "daily",
      eyebrow: "Daily packs",
      title: `${dailyPackLimit} Trainer packs a day.`,
      body: "The limit resets at midnight UTC. Opening on consecutive days builds a streak, which adds a little XP bonus.",
      points: [
        "Use them when you want — they don't roll over.",
        "Sandbox is always there if you just want to rip packs.",
      ],
    },
    {
      id: "binder",
      eyebrow: "Collection & binder",
      title: "Keep cards. Show a few off.",
      body: "Every Trainer pull lands in your collection. Your binder is a public 3×3 page — put your favourite hits front and centre.",
      points: [
        "Browse and filter your collection anytime.",
        "Only cards you own can go in the binder.",
        "Anyone with your profile link can view it.",
      ],
    },
    {
      id: "profile",
      eyebrow: "Profile",
      title: "Make it yours.",
      body: "Your profile is public. Friends can compare collections with you, and rare pulls can show up on the feed.",
    },
    {
      id: "ready",
      eyebrow: "Ready",
      title: "Time to open a pack.",
      body: "Pick a set, open in Trainer mode, and your first cards will save automatically. You can change profile details later in Account.",
    },
  ];
}

export function OnboardingFlow({
  username,
  dailyPackLimit,
  initialFavouritePokemon = "",
  initialBio = "",
}: {
  username: string;
  dailyPackLimit: number;
  initialFavouritePokemon?: string;
  initialBio?: string;
}) {
  const steps = useMemo(() => buildSteps(dailyPackLimit), [dailyPackLimit]);
  const [stepIndex, setStepIndex] = useState(0);
  const [favouritePokemon, setFavouritePokemon] = useState(initialFavouritePokemon);
  const [bio, setBio] = useState(initialBio);
  const [pending, startTransition] = useTransition();

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const isProfileStep = step.id === "profile";

  const progress = useMemo(
    () => ((stepIndex + 1) / steps.length) * 100,
    [stepIndex, steps.length],
  );

  function finish(next?: string) {
    startTransition(async () => {
      await completeOnboarding({
        favouritePokemon,
        bio,
        next,
      });
    });
  }

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col">
      <div className="mb-10">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-2">
            Getting started · {stepIndex + 1} / {steps.length}
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => finish("/dashboard")}
            className="text-[10px] font-bold uppercase tracking-widest text-muted-2 transition-colors hover:text-category disabled:opacity-50"
          >
            Skip
          </button>
        </div>
        <div className="mt-4 h-1 overflow-hidden bg-surface-2">
          <motion.div
            className="h-full bg-white"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="relative min-h-[22rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-2">
              {step.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tighter text-white sm:text-5xl">
              {step.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">{step.body}</p>

            {step.id === "welcome" && (
              <p className="mt-4 text-sm text-muted-2">
                Signed in as{" "}
                <span className="font-medium text-category">{username}</span>
              </p>
            )}

            {step.points && (
              <ul className="mt-8 space-y-3 border-t border-border pt-8">
                {step.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 text-sm leading-relaxed text-muted"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-zinc-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}

            {isProfileStep && (
              <div className="mt-8 flex flex-col gap-4 border-t border-border pt-8">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">
                    Favourite Pokémon{" "}
                    <span className="text-zinc-700">(optional)</span>
                  </span>
                  <input
                    value={favouritePokemon}
                    onChange={(e) => setFavouritePokemon(e.target.value)}
                    maxLength={40}
                    placeholder="e.g. Gengar"
                    className="h-12 border border-border bg-surface px-4 text-white outline-none transition-colors placeholder:text-muted-2 focus:border-zinc-600"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">
                    Short bio <span className="text-zinc-700">(optional)</span>
                  </span>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={280}
                    rows={3}
                    placeholder="Collector, chase card hunter, etc."
                    className="resize-none border border-border bg-surface px-4 py-3 text-white outline-none transition-colors placeholder:text-muted-2 focus:border-zinc-600"
                  />
                </label>
              </div>
            )}

            {step.id === "ready" && (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="border border-border bg-surface p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-2">
                    Next
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    Open a Trainer pack
                  </p>
                  <p className="mt-1 text-xs text-muted-2">
                    Cards save to your collection.
                  </p>
                </div>
                <div className="border border-border bg-surface p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-2">
                    Later
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    Fill your binder
                  </p>
                  <p className="mt-1 text-xs text-muted-2">
                    Showcase hits from Collection → Binder.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-12 flex items-center justify-between gap-3 border-t border-border pt-8">
        <Button
          type="button"
          variant="ghost"
          disabled={stepIndex === 0 || pending}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          className="px-5"
        >
          Back
        </Button>

        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 transition-all ${
                i === stepIndex
                  ? "w-6 bg-white"
                  : i < stepIndex
                    ? "w-1.5 bg-zinc-500"
                    : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        {isLast ? (
          <Button
            type="button"
            disabled={pending}
            onClick={() => finish("/open-pack?mode=trainer")}
            className="px-6"
          >
            {pending ? "..." : "Open a pack →"}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={pending}
            onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
            className="px-6"
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}

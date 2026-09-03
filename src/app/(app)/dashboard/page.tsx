import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getOrCreateProfile } from "@/lib/game/profile";
import { redirectIfNeedsOnboarding } from "@/lib/game/onboarding";
import { getSetProgress } from "@/lib/game/queries";
import { DAILY_PACK_LIMIT } from "@/lib/game/open-pack";
import { xpForLevel } from "@/lib/packs/rarity";
import { LinkButton, ProgressBar, SectionEyebrow } from "@/components/ui";
import { SectionSkeleton } from "@/components/skeletons";
import type { Profile } from "@/db/schema";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/login?next=/dashboard");
  redirectIfNeedsOnboarding(profile);

  return (
    <div className="flex w-full flex-col gap-16 md:gap-24">
      <DashboardHero profile={profile} />
      <DashboardStats profile={profile} />
      <DashboardDaily profile={profile} />
      <Suspense fallback={<SectionSkeleton />}>
        <DashboardSetProgress userId={profile.id} />
      </Suspense>
      <DashboardGetStarted packsLeft={packsLeftFor(profile)} />
    </div>
  );
}

function packsLeftFor(profile: Profile) {
  const today = new Date().toISOString().slice(0, 10);
  const packsUsed = profile.lastPackDate === today ? profile.packsOpenedToday : 0;
  return Math.max(0, DAILY_PACK_LIMIT - packsUsed);
}

function DashboardHero({ profile }: { profile: Profile }) {
  const packsLeft = packsLeftFor(profile);

  return (
    <header className="grid gap-10 border-b border-border pb-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16">
      <div className="min-w-0">
        <SectionEyebrow>Trainer hub</SectionEyebrow>
        <h1 className="title-l text-white">
          Welcome back,
          <br />
          {profile.username}.
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-2 sm:text-xl">
          {packsLeft > 0
            ? `${packsLeft} trainer pack${packsLeft === 1 ? "" : "s"} left today. Rip a booster, grow the vault, keep the streak alive.`
            : "Trainer packs are done for today. Sandbox is still open if you want unlimited practice pulls."}
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:items-end">
        {packsLeft > 0 ? (
          <LinkButton
            href="/open-pack?mode=trainer"
            className="h-12 w-full px-8 text-sm lg:w-auto"
          >
            Open a pack <span aria-hidden className="ml-2 font-normal opacity-70">→</span>
          </LinkButton>
        ) : (
          <LinkButton
            href="/open-pack?mode=sandbox"
            className="h-12 w-full px-8 text-sm lg:w-auto"
          >
            Practice in sandbox <span aria-hidden className="ml-2 font-normal opacity-70">→</span>
          </LinkButton>
        )}
        <Link
          href={packsLeft > 0 ? "/open-pack?mode=sandbox" : "/collection"}
          className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-category transition-colors hover:text-white lg:text-right"
        >
          {packsLeft > 0 ? "Or try sandbox →" : "View collection →"}
        </Link>
      </div>
    </header>
  );
}

function DashboardStats({ profile }: { profile: Profile }) {
  const stats = [
    { label: "Level", value: String(profile.level) },
    { label: "Streak", value: `${profile.currentStreak}d` },
    { label: "Packs opened", value: profile.totalPacksOpened.toLocaleString() },
    {
      label: "Cards collected",
      value: profile.totalCardsCollected.toLocaleString(),
    },
  ];

  return (
    <section>
      <div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group bg-background p-8 transition-colors hover:bg-surface sm:p-10"
          >
            <div className="mb-2 text-4xl font-medium tracking-[-0.04em] text-white">
              {stat.value}
            </div>
            <div className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted transition-colors group-hover:text-category">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardDaily({ profile }: { profile: Profile }) {
  const today = new Date().toISOString().slice(0, 10);
  const packsUsed = profile.lastPackDate === today ? profile.packsOpenedToday : 0;
  const packsLeft = Math.max(0, DAILY_PACK_LIMIT - packsUsed);

  const xpIntoLevel = profile.xp - xpForLevel(profile.level);
  const xpForNext = xpForLevel(profile.level + 1) - xpForLevel(profile.level);

  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setUTCHours(24, 0, 0, 0);
  const msToReset = nextReset.getTime() - now.getTime();
  const hoursToReset = Math.floor(msToReset / 3_600_000);
  const minsToReset = Math.floor((msToReset % 3_600_000) / 60_000);

  return (
    <section className="grid gap-12 border-b border-border pb-16 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-20">
      <div>
        <SectionEyebrow>Daily packs</SectionEyebrow>
        <h2 className="title-m text-white">
          {packsLeft > 0 ? `${packsLeft} left today` : "Done for today"}
        </h2>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted-2 sm:text-lg">
          {packsLeft > 0
            ? profile.currentStreak > 0
              ? `${profile.currentStreak}-day streak. Open one to keep it going.`
              : `${DAILY_PACK_LIMIT} trainer packs per day. Sandbox is unlimited.`
            : `Resets in ${hoursToReset}h ${minsToReset}m. Sandbox is still open.`}
        </p>

        <div className="mt-10 flex items-center gap-2">
          {Array.from({ length: DAILY_PACK_LIMIT }).map((_, i) => (
            <div
              key={i}
              title={i < packsUsed ? "Opened" : "Available"}
              className={`h-1.5 w-12 sm:w-14 ${
                i < packsUsed ? "bg-surface-2" : "bg-white"
              }`}
            />
          ))}
          <span className="ml-2 font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted">
            {packsUsed}/{DAILY_PACK_LIMIT}
          </span>
        </div>
      </div>

      <div className="border border-border bg-surface p-8 sm:p-10">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-category">
            Level {profile.level}
          </span>
          <span className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted">
            {xpIntoLevel.toLocaleString()} / {xpForNext.toLocaleString()} XP
          </span>
        </div>
        <ProgressBar className="mt-4 h-1" value={xpIntoLevel} max={xpForNext} />
        <p className="mt-6 text-sm leading-relaxed text-muted-2">
          XP comes from trainer packs. Hit the next level and keep filling set
          checklists across your collection.
        </p>
        <Link
          href="/achievements"
          className="mt-8 inline-flex font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-category transition-colors hover:text-white"
        >
          View achievements →
        </Link>
      </div>
    </section>
  );
}

async function DashboardSetProgress({ userId }: { userId: string }) {
  const setProgress = await getSetProgress(userId);

  const inProgress = [...setProgress]
    .filter((p) => !p.completedAt)
    .sort(
      (a, b) =>
        b.uniqueOwned / Math.max(b.set.total, 1) -
        a.uniqueOwned / Math.max(a.set.total, 1),
    )
    .slice(0, 4);

  const completedCount = setProgress.filter((p) => p.completedAt).length;

  return (
    <section>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionEyebrow>Collection</SectionEyebrow>
          <h2 className="title-m text-white">Sets in progress</h2>
          {completedCount > 0 ? (
            <p className="mt-4 text-base text-muted-2">
              {completedCount} set{completedCount === 1 ? "" : "s"} completed
            </p>
          ) : (
            <p className="mt-4 max-w-md text-base text-muted-2">
              Open trainer packs to start filling expansion checklists.
            </p>
          )}
        </div>
        <Link
          href="/collection"
          className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-category transition-colors hover:text-white"
        >
          Full collection →
        </Link>
      </div>

      {inProgress.length === 0 ? (
        <div className="border border-dashed border-border px-6 py-14 text-center">
          <p className="text-base text-muted">No sets started yet.</p>
          <p className="mt-2 text-sm text-muted-2">
            Open a trainer pack to begin filling checklists.
          </p>
          <LinkButton href="/open-pack?mode=trainer" className="mt-8 h-11 px-6">
            Open a pack
          </LinkButton>
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {inProgress.map((p) => {
            const pct = Math.floor(
              (p.uniqueOwned / Math.max(p.set.total, 1)) * 100,
            );
            return (
              <li key={p.set.id}>
                <Link
                  href={`/collection?set=${p.set.id}`}
                  className="flex flex-col gap-4 py-6 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:gap-8"
                >
                  <div className="min-w-0">
                    <p className="truncate text-lg font-medium tracking-[-0.02em] text-white">
                      {p.set.name}
                    </p>
                    <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted">
                      {p.uniqueOwned}/{p.set.total} · {pct}%
                    </p>
                  </div>
                  <div className="w-full sm:w-48">
                    <ProgressBar value={p.uniqueOwned} max={p.set.total} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function DashboardGetStarted({ packsLeft }: { packsLeft: number }) {
  const items = [
    {
      title: "Open packs",
      description:
        packsLeft > 0
          ? "Use today's trainer packs, or rip unlimited sandbox boosters."
          : "Trainer packs reset soon. Sandbox is open for unlimited practice.",
      href: packsLeft > 0 ? "/open-pack?mode=trainer" : "/open-pack?mode=sandbox",
      cta: packsLeft > 0 ? "Open a pack" : "Go to sandbox",
    },
    {
      title: "Browse sets",
      description: "Pick an expansion and see every card in the checklist.",
      href: "/sets",
      cta: "Browse sets",
    },
    {
      title: "Show the vault",
      description: "Edit your binder and share pulls with friends.",
      href: "/collection",
      cta: "Open collection",
    },
    {
      title: "Find friends",
      description: "Add trainers, compare collections, and trade stories.",
      href: "/friends",
      cta: "Friends",
    },
  ];

  return (
    <section>
      <SectionEyebrow>Get started</SectionEyebrow>
      <h2 className="title-m text-white">What do you want to do?</h2>
      <div className="mt-10 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.href + item.title}
            href={item.href}
            className="group flex flex-col bg-background p-8 transition-colors hover:bg-surface sm:p-10"
          >
            <h3 className="text-xl font-medium tracking-[-0.03em] text-white">
              {item.title}
            </h3>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-2">
              {item.description}
            </p>
            <span className="mt-8 font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-category transition-colors group-hover:text-accent">
              {item.cta} →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

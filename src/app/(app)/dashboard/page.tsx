import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateProfile } from "@/lib/game/profile";
import { redirectIfNeedsOnboarding } from "@/lib/game/onboarding";
import {
  getCardsCollectedFromPacks,
  getSetProgress,
} from "@/lib/game/queries";
import { DAILY_PACK_LIMIT } from "@/lib/game/open-pack";
import { xpForLevel } from "@/lib/packs/rarity";
import { LinkButton, ProgressBar } from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/login?next=/dashboard");
  redirectIfNeedsOnboarding(profile);

  const [cardsCollected, setProgress] = await Promise.all([
    getCardsCollectedFromPacks(profile.id),
    getSetProgress(profile.id),
  ]);

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-12">
      {/* Greeting */}
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Trainer
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          {profile.username}
        </h1>
      </header>

      {/* Packs — one primary action */}
      <section className="border-y border-zinc-900 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Daily packs
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              {packsLeft > 0
                ? `${packsLeft} left today`
                : "Done for today"}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              {packsLeft > 0
                ? profile.currentStreak > 0
                  ? `${profile.currentStreak}-day streak — open one to keep it going.`
                  : `${DAILY_PACK_LIMIT} trainer packs per day. Sandbox is unlimited.`
                : `Resets in ${hoursToReset}h ${minsToReset}m. Sandbox is still open.`}
            </p>

            <div className="mt-5 flex items-center gap-1.5">
              {Array.from({ length: DAILY_PACK_LIMIT }).map((_, i) => (
                <div
                  key={i}
                  title={i < packsUsed ? "Opened" : "Available"}
                  className={`h-1.5 w-10 rounded-full ${
                    i < packsUsed ? "bg-zinc-700" : "bg-white"
                  }`}
                />
              ))}
              <span className="ml-2 text-xs text-zinc-600">
                {packsUsed}/{DAILY_PACK_LIMIT}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            {packsLeft > 0 ? (
              <LinkButton href="/open-pack?mode=trainer" className="h-11 px-6">
                Open a pack
              </LinkButton>
            ) : (
              <LinkButton href="/open-pack?mode=sandbox" className="h-11 px-6">
                Practice in sandbox
              </LinkButton>
            )}
            <Link
              href={packsLeft > 0 ? "/open-pack?mode=sandbox" : "/collection"}
              className="text-center text-xs font-medium text-zinc-500 transition-colors hover:text-white sm:text-right"
            >
              {packsLeft > 0 ? "Or try sandbox →" : "View collection →"}
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="font-medium text-zinc-400">Level {profile.level}</span>
            <span className="text-zinc-600">
              {xpIntoLevel.toLocaleString()} / {xpForNext.toLocaleString()} XP
            </span>
          </div>
          <ProgressBar className="mt-2 h-1" value={xpIntoLevel} max={xpForNext} />
        </div>
      </section>

      {/* Stats — one quiet strip */}
      <section>
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat label="Level" value={profile.level} />
          <Stat label="Streak" value={`${profile.currentStreak}d`} />
          <Stat label="Packs" value={profile.totalPacksOpened.toLocaleString()} />
          <Stat label="Cards" value={cardsCollected.toLocaleString()} />
        </dl>
      </section>

      {/* Set progress — one job */}
      <section>
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">
              Sets in progress
            </h2>
            {completedCount > 0 && (
              <p className="mt-1 text-xs text-zinc-600">
                {completedCount} set{completedCount === 1 ? "" : "s"} completed
              </p>
            )}
          </div>
          <Link
            href="/collection"
            className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-white"
          >
            Collection
          </Link>
        </div>

        {inProgress.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 px-5 py-10 text-center">
            <p className="text-sm text-zinc-400">No sets started yet.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Open a trainer pack to begin filling checklists.
            </p>
            <LinkButton href="/open-pack?mode=trainer" className="mt-5 h-10 px-5">
              Open a pack
            </LinkButton>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-900 border-y border-zinc-900">
            {inProgress.map((p) => {
              const pct = Math.floor(
                (p.uniqueOwned / Math.max(p.set.total, 1)) * 100,
              );
              return (
                <li key={p.set.id}>
                  <Link
                    href={`/collection?set=${p.set.id}`}
                    className="flex flex-col gap-3 py-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-200">
                        {p.set.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {p.uniqueOwned}/{p.set.total} · {pct}%
                      </p>
                    </div>
                    <div className="w-full sm:w-40">
                      <ProgressBar value={p.uniqueOwned} max={p.set.total} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-bold tracking-tight text-white">{value}</dd>
    </div>
  );
}

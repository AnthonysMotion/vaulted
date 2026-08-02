import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateProfile } from "@/lib/game/profile";
import { redirectIfNeedsOnboarding } from "@/lib/game/onboarding";
import {
  getCardsCollectedFromPacks,
  getSetProgress,
  getGlobalFeed,
  getUserActivityByDay,
} from "@/lib/game/queries";
import { DAILY_PACK_LIMIT } from "@/lib/game/open-pack";
import { xpForLevel } from "@/lib/packs/rarity";
import { Card, LinkButton, ProgressBar, StatCard } from "@/components/ui";
import { FeedList } from "@/components/feed-list";
import { ActivityHeatmap } from "@/components/activity-heatmap";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/login?next=/dashboard");
  redirectIfNeedsOnboarding(profile);

  const [cardsCollected, setProgress, feed, activity] = await Promise.all([
    getCardsCollectedFromPacks(profile.id),
    getSetProgress(profile.id),
    getGlobalFeed(5),
    getUserActivityByDay(profile.id),
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

  const nearestSet = [...setProgress]
    .filter((p) => !p.completedAt)
    .sort(
      (a, b) =>
        b.uniqueOwned / Math.max(b.set.total, 1) -
        a.uniqueOwned / Math.max(a.set.total, 1),
    )[0];

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {/* Pack CTA */}
      <Card className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_55%)]"
        />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)] lg:items-center">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Daily trainer packs
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              {packsLeft > 0 ? "Ready to open?" : "You're done for today"}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
              {packsLeft > 0
                ? `${packsLeft} of ${DAILY_PACK_LIMIT} trainer pack${packsLeft === 1 ? "" : "s"} left. Keep your streak alive and grow the collection.`
                : `Trainer packs reset in ${hoursToReset}h ${minsToReset}m. Practice in sandbox anytime.`}
            </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
              {Array.from({ length: DAILY_PACK_LIMIT }).map((_, i) => {
                const used = i < packsUsed;
                return (
                  <div
                    key={i}
                    title={used ? "Opened" : "Available"}
                    className={`h-2.5 min-w-0 flex-1 max-w-12 rounded-full sm:flex-none sm:w-12 ${
                      used ? "bg-zinc-700" : "bg-white"
                    }`}
                  />
                );
              })}
              <span className="w-full text-xs font-medium text-zinc-500 sm:ml-2 sm:w-auto">
                {packsUsed}/{DAILY_PACK_LIMIT} opened
              </span>
            </div>

            {profile.currentStreak > 0 && (
              <p className="mt-4 text-xs text-zinc-500">
                <span className="font-semibold text-zinc-300">
                  {profile.currentStreak}-day streak
                </span>
                {packsLeft > 0
                  ? " — open a pack today to keep it going."
                  : " locked in for today."}
              </p>
            )}

            <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
              {packsLeft > 0 ? (
                <LinkButton href="/open-pack?mode=trainer" className="h-11 w-full px-6 sm:w-auto">
                  Open a pack
                </LinkButton>
              ) : (
                <LinkButton href="/open-pack?mode=sandbox" className="h-11 w-full px-6 sm:w-auto">
                  Practice in sandbox
                </LinkButton>
              )}
              <LinkButton
                href={packsLeft > 0 ? "/open-pack?mode=sandbox" : "/collection"}
                variant="dark"
                className="h-11 w-full px-6 sm:w-auto"
              >
                {packsLeft > 0 ? "Sandbox" : "View collection"}
              </LinkButton>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-4 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Quick links
            </p>
            <QuickLink href="/collection" label="Collection" hint="Browse owned cards" />
            <QuickLink href="/sets" label="Sets" hint="Browse set checklists" />
            <QuickLink
              href={`/profile/${profile.username}`}
              label="Profile"
              hint="Showcase & binder"
            />
            <QuickLink href="/friends" label="Friends" hint="Add trainers" />
            {nearestSet && (
              <Link
                href={`/open-pack/${nearestSet.set.id}?mode=${packsLeft > 0 ? "trainer" : "sandbox"}`}
                className="mt-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 transition-colors hover:bg-white/[0.06]"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Continue set
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-white">
                  {nearestSet.set.name}
                </p>
                <ProgressBar
                  className="mt-2"
                  value={nearestSet.uniqueOwned}
                  max={nearestSet.set.total}
                />
                <p className="mt-1.5 text-[11px] text-zinc-500">
                  {nearestSet.uniqueOwned}/{nearestSet.set.total} ·{" "}
                  {Math.floor(
                    (nearestSet.uniqueOwned / nearestSet.set.total) * 100,
                  )}
                  %
                </p>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Level" value={profile.level} />
        <StatCard label="Current streak" value={`${profile.currentStreak}d`} />
        <StatCard
          label="Packs opened"
          value={profile.totalPacksOpened.toLocaleString()}
        />
        <StatCard
          label="Cards collected"
          value={cardsCollected.toLocaleString()}
        />
      </div>

      {/* XP */}
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
            Level {profile.level}
          </h2>
          <p className="text-xs text-zinc-500">
            <span className="font-medium text-zinc-300">
              {xpIntoLevel.toLocaleString()}
            </span>{" "}
            / {xpForNext.toLocaleString()} XP to level {profile.level + 1}
          </p>
        </div>
        <ProgressBar className="mt-4 h-1.5" value={xpIntoLevel} max={xpForNext} />
      </Card>

      {/* Opening activity heatmap */}
      <Card>
        <ActivityHeatmap days={activity.days} />
      </Card>

      {/* Progress + activity */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)] lg:items-start">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
              Set progress
            </h2>
            <Link
              href="/collection"
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-white"
            >
              Collection
            </Link>
          </div>

          {setProgress.length === 0 ? (
            <Card className="border-dashed">
              <p className="text-sm text-zinc-400">No set progress yet.</p>
              <p className="mt-1 text-xs text-zinc-600">
                Open a trainer pack to start filling sets.
              </p>
              <LinkButton
                href="/open-pack?mode=trainer"
                className="mt-4 h-10 px-5"
              >
                Open a pack
              </LinkButton>
            </Card>
          ) : (
            <Card className="!p-0 overflow-hidden">
              <div className="divide-y divide-zinc-900">
                {setProgress.slice(0, 5).map((p) => {
                  const pct = Math.floor(
                    (p.uniqueOwned / Math.max(p.set.total, 1)) * 100,
                  );
                  return (
                    <Link
                      key={p.set.id}
                      href={`/collection?set=${p.set.id}`}
                      className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-200">
                          {p.completedAt ? "🏆 " : ""}
                          {p.set.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          {p.uniqueOwned}/{p.set.total} · {pct}%
                        </p>
                      </div>
                      <div className="w-full sm:w-36">
                        <ProgressBar
                          value={p.uniqueOwned}
                          max={p.set.total}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
              Activity
            </h2>
            <Link
              href="/feed"
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-white"
            >
              Full feed
            </Link>
          </div>
          <Card>
            <FeedList items={feed} viewerId={profile.id} compact />
          </Card>
        </section>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  hint,
}: {
  href: string;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
    >
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      <span className="truncate text-[11px] text-zinc-600">{hint}</span>
    </Link>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateProfile } from "@/lib/game/profile";
import { redirectIfNeedsOnboarding } from "@/lib/game/onboarding";
import {
  getCollectionSummary,
  getSetProgress,
  getGlobalFeed,
} from "@/lib/game/queries";
import { DAILY_PACK_LIMIT } from "@/lib/game/open-pack";
import { xpForLevel } from "@/lib/packs/rarity";
import { Card, LinkButton, ProgressBar, StatCard, SectionEyebrow } from "@/components/ui";
import { FeedList } from "@/components/feed-list";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/login?next=/dashboard");
  redirectIfNeedsOnboarding(profile);

  const [summary, setProgress, feed] = await Promise.all([
    getCollectionSummary(profile.id),
    getSetProgress(profile.id),
    getGlobalFeed(15),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const packsUsed = profile.lastPackDate === today ? profile.packsOpenedToday : 0;
  const packsLeft = Math.max(0, DAILY_PACK_LIMIT - packsUsed);

  const currentLevelXp = xpForLevel(profile.level);
  const nextLevelXp = xpForLevel(profile.level + 1);

  // Reset timer: next UTC midnight (server-rendered snapshot)
  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setUTCHours(24, 0, 0, 0);
  const msToReset = nextReset.getTime() - now.getTime();
  const hoursToReset = Math.floor(msToReset / 3_600_000);
  const minsToReset = Math.floor((msToReset % 3_600_000) / 60_000);

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
           <SectionEyebrow>Account Overview</SectionEyebrow>
          <h1 className="mt-4 text-4xl font-black tracking-tighter text-white sm:text-5xl">
            Hi, {profile.username}.
          </h1>
          <p className="mt-4 text-zinc-500 font-medium">
            {packsLeft > 0
              ? `You have ${packsLeft} pack${packsLeft === 1 ? "" : "s"} left to open today.`
              : `All packs opened — resets in ${hoursToReset}h ${minsToReset}m.`}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/open-pack" variant="primary" className="h-12 px-6 sm:min-w-[150px]">Open Packs</LinkButton>
          <LinkButton href={`/profile/${profile.username}`} variant="dark" className="h-12 px-6 sm:min-w-[150px]">
            View Profile
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-zinc-900 border border-zinc-900 rounded-xl overflow-hidden lg:grid-cols-4 shadow-2xl">
        <div className="bg-black p-5 sm:p-8">
          <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-4">Level</div>
          <div className="text-3xl font-black text-white">Lvl {profile.level}</div>
        </div>
        <div className="bg-black p-5 sm:p-8">
          <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-4">Streak</div>
          <div className="text-3xl font-black text-white">{profile.currentStreak} Days</div>
        </div>
        <div className="bg-black p-5 sm:p-8">
          <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-4">Packs</div>
          <div className="text-3xl font-black text-white">{profile.totalPacksOpened.toLocaleString()}</div>
        </div>
        <div className="bg-black p-5 sm:p-8">
          <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-4">Cards</div>
          <div className="text-3xl font-black text-white">{(summary.copies ?? 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950 p-5 sm:p-8">
        <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Progression</span>
            <span className="text-xs font-black text-white uppercase tracking-tighter">
              {profile.xp - currentLevelXp} / {nextLevelXp - currentLevelXp} XP to Lvl {profile.level + 1}
            </span>
          </div>
          <ProgressBar
            className="h-2"
            value={profile.xp - currentLevelXp}
            max={nextLevelXp - currentLevelXp}
          />
        </div>
      </div>

      <div className="grid gap-8 md:gap-12 lg:grid-cols-[1fr_400px]">
        <section>
          <div className="mb-8 flex items-center gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Recent Collections</h2>
            <div className="h-px flex-1 bg-zinc-900" />
          </div>
          {setProgress.length === 0 ? (
            <div className="bg-zinc-950 border border-dashed border-zinc-900 rounded-xl p-12 text-center">
              <p className="text-zinc-500 text-sm">Open your first pack to see progress.</p>
            </div>
          ) : (
            <div className="grid gap-px bg-zinc-900 border border-zinc-900 rounded-xl overflow-hidden">
              {setProgress.slice(0, 6).map((p) => (
                <Link
                  key={p.set.id}
                  href={`/collection?set=${p.set.id}`}
                  className="group flex flex-col gap-4 bg-black p-5 transition-colors hover:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-white group-hover:text-white flex items-center gap-2">
                      {p.completedAt && <span className="text-xs">🏆</span>}
                      {p.set.name}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                      {p.uniqueOwned}/{p.set.total} · {Math.floor((p.uniqueOwned / p.set.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full sm:w-32">
                    <ProgressBar className="h-1" value={p.uniqueOwned} max={p.set.total} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-8 flex items-center gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Activity</h2>
            <div className="h-px flex-1 bg-zinc-900" />
          </div>
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
            <FeedList items={feed} viewerId={profile.id} compact />
          </div>
        </section>
      </div>
    </div>
  );
}

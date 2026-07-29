import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateProfile } from "@/lib/game/profile";
import {
  getCollectionSummary,
  getSetProgress,
  getGlobalFeed,
} from "@/lib/game/queries";
import { DAILY_PACK_LIMIT } from "@/lib/game/open-pack";
import { xpForLevel } from "@/lib/packs/rarity";
import { Card, LinkButton, ProgressBar, StatCard } from "@/components/ui";
import { FeedList } from "@/components/feed-list";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/login?next=/dashboard");

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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="title-m">
            Welcome back, <span className="text-anthracite">{profile.username}</span>
          </h1>
          <p className="mt-2 text-muted">
            {packsLeft > 0
              ? `You have ${packsLeft} pack${packsLeft === 1 ? "" : "s"} to open today.`
              : `All packs opened — resets in ${hoursToReset}h ${minsToReset}m.`}
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/open-pack?mode=trainer">Open packs</LinkButton>
          <LinkButton href={`/profile/${profile.username}`} variant="secondary">
            My profile
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Trainer level" value={profile.level} icon="⭐" />
        <StatCard label="Daily streak" value={`${profile.currentStreak} days`} icon="🔥" />
        <StatCard label="Packs opened" value={profile.totalPacksOpened.toLocaleString()} icon="📦" />
        <StatCard label="Cards collected" value={(summary.copies ?? 0).toLocaleString()} icon="🎴" />
      </div>

      <Card>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Level {profile.level}</span>
          <span className="text-muted">
            {profile.xp - currentLevelXp} / {nextLevelXp - currentLevelXp} XP to level{" "}
            {profile.level + 1}
          </span>
        </div>
        <ProgressBar
          className="mt-2"
          value={profile.xp - currentLevelXp}
          max={nextLevelXp - currentLevelXp}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-bold">Set progress</h2>
          {setProgress.length === 0 ? (
            <Card className="text-sm text-muted">
              Open your first Trainer Mode pack to start tracking set completion.
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {setProgress.slice(0, 6).map((p) => (
                <Link
                  key={p.set.id}
                  href={`/collection?set=${p.set.id}`}
                  className="rounded-xl border border-border bg-surface p-4 hover:border-primary/40"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">
                      {p.completedAt && "🏆 "}
                      {p.set.name}
                    </span>
                    <span className="text-muted">
                      {p.uniqueOwned}/{p.set.total} ·{" "}
                      {Math.floor((p.uniqueOwned / p.set.total) * 100)}%
                    </span>
                  </div>
                  <ProgressBar className="mt-2" value={p.uniqueOwned} max={p.set.total} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Community feed</h2>
          <FeedList items={feed} viewerId={profile.id} compact />
        </section>
      </div>
    </div>
  );
}

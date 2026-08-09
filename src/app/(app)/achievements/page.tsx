import { redirect } from "next/navigation";
import { db } from "@/db";
import { achievements, userAchievements } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/game/profile";
import { redirectIfNeedsOnboarding } from "@/lib/game/onboarding";
import { Badge, Card, SectionEyebrow } from "@/components/ui";
import { asc, eq } from "drizzle-orm";

export const metadata = { title: "Achievements" };

const CATEGORY_LABELS: Record<string, string> = {
  packs: "Packs",
  pulls: "Pulls",
  collection: "Collection",
  streak: "Streaks",
  level: "Levels",
};

const CATEGORY_ORDER = ["packs", "pulls", "collection", "streak", "level"];

export default async function AchievementsPage() {
  const profile = await getOrCreateProfile().catch(() => null);
  if (!profile) redirect("/login?next=/achievements");
  redirectIfNeedsOnboarding(profile);

  const [allAchievements, unlockedRows] = await Promise.all([
    db.query.achievements.findMany({
      orderBy: [asc(achievements.category), asc(achievements.threshold), asc(achievements.name)],
    }),
    db.query.userAchievements.findMany({
      where: eq(userAchievements.userId, profile.id),
      columns: { achievementId: true, unlockedAt: true },
    }),
  ]);

  const unlockedById = new Map(unlockedRows.map((row) => [row.achievementId, row]));
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category] ?? category,
    items: allAchievements.filter((achievement) => achievement.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SectionEyebrow>Progress</SectionEyebrow>
          <h1 className="mt-4 text-4xl font-black tracking-tighter text-white sm:text-5xl">
            Achievements.
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-medium text-muted-2 sm:text-base">
            Track every unlock in Vaulted and see which milestones you&apos;ve already collected.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="gold">
            {unlockedRows.length} / {allAchievements.length} unlocked
          </Badge>
        </div>
      </div>

      <div className="grid gap-8">
        {grouped.map((group) => (
          <section key={group.category} className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-2">
                {group.label}
              </h2>
              <div className="h-px flex-1 bg-surface-2" />
              <Badge>{group.items.length}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((achievement) => {
                const unlocked = unlockedById.get(achievement.id);
                return (
                  <Card
                    key={achievement.id}
                    variant="surface"
                    className={`flex h-full flex-col gap-4 border-border ${
                      unlocked ? "bg-surface" : "opacity-75"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="grid h-12 w-12 shrink-0 place-items-center border border-border bg-black text-2xl">
                          {achievement.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{achievement.name}</h3>
                          <p className="mt-1 text-sm text-muted-2">{achievement.description}</p>
                        </div>
                      </div>
                      <Badge color={unlocked ? "green" : "default"}>
                        {unlocked ? "Unlocked" : "Locked"}
                      </Badge>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <Badge>{achievement.threshold} goal</Badge>
                      <Badge color="blue">+{achievement.xpReward} XP</Badge>
                      {unlocked?.unlockedAt && (
                        <Badge color="purple">
                          {new Date(unlocked.unlockedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Badge>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

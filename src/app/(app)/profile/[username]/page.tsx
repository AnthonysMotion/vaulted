/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { userAchievements } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getBinder,
  getCollectionSummary,
  getProfileByUsername,
  getSetProgress,
} from "@/lib/game/queries";
import { getOrCreateProfile } from "@/lib/game/profile";
import { rarityTier } from "@/lib/packs/rarity";
import { Badge, Card, LinkButton, ProgressBar, StatCard } from "@/components/ui";
import { CardTile } from "@/components/card-tile";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [summary, progress, binder, unlocked, viewer] = await Promise.all([
    getCollectionSummary(profile.id),
    getSetProgress(profile.id),
    getBinder(profile.id),
    db.query.userAchievements.findMany({
      where: eq(userAchievements.userId, profile.id),
      with: { achievement: true },
    }),
    getOrCreateProfile().catch(() => null),
  ]);

  const isOwner = viewer?.id === profile.id;
  const completedSets = progress.filter((p) => p.completedAt);
  const topProgress = progress.slice(0, 3);
  const binderCards = (binder?.slots ?? [])
    .sort((a, b) => a.position - b.position)
    .slice(0, 9);

  const joinedLabel = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      {/* Full-bleed profile header — cancels main top padding so banner hits viewport top */}
      <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -mt-24 sm:-mt-32 md:-mt-40">
        <div className="relative isolate">
          <div
            className="relative h-64 overflow-hidden bg-zinc-950 sm:h-80 md:h-96"
            style={
              profile.bannerUrl
                ? {
                    backgroundImage: `url(${profile.bannerUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {!profile.bannerUrl && (
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.08),transparent_55%),linear-gradient(180deg,#111_0%,#050505_100%)]"
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-px bg-zinc-900"
            />
          </div>

          <div className="mx-auto max-w-[1200px] px-5 sm:px-8 md:px-10">
            <div className="relative -mt-14 flex flex-col gap-6 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between sm:gap-8 md:-mt-20">
              <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
                <div className="relative z-10 grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-2xl bg-zinc-950 text-5xl shadow-[0_20px_50px_rgba(0,0,0,0.65)] sm:h-36 sm:w-36 md:h-40 md:w-40">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span aria-hidden>🧢</span>
                  )}
                </div>

                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="truncate text-3xl font-black tracking-tighter text-white sm:text-4xl">
                      {profile.username}
                    </h1>
                    {profile.isDeveloper && (
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                        Dev
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                    <span className="font-medium text-zinc-200">
                      Level {profile.level} trainer
                    </span>
                    <span aria-hidden className="text-zinc-700">
                      ·
                    </span>
                    <span>Joined {joinedLabel}</span>
                  </div>

                  {profile.bio ? (
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
                      {profile.bio}
                    </p>
                  ) : isOwner ? (
                    <p className="mt-3 text-sm text-zinc-600">
                      No bio yet.{" "}
                      <Link
                        href="/account"
                        className="underline underline-offset-4 hover:text-zinc-300"
                      >
                        Add one
                      </Link>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:pb-1">
                <LinkButton
                  href={`/binder/${profile.username}`}
                  variant="dark"
                  className="w-full sm:w-auto"
                >
                  View binder
                </LinkButton>
                {isOwner ? (
                  <LinkButton
                    href="/account"
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Edit profile
                  </LinkButton>
                ) : viewer ? (
                  <LinkButton
                    href={`/friends?add=${profile.username}`}
                    className="w-full sm:w-auto"
                  >
                    Add friend
                  </LinkButton>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Cards collected" value={(summary.copies ?? 0).toLocaleString()} icon="⭐" />
        <StatCard label="Packs opened" value={profile.totalPacksOpened.toLocaleString()} icon="📦" />
        <StatCard label="Current streak" value={`${profile.currentStreak} days`} icon="🔥" />
        <StatCard label="Sets completed" value={completedSets.length} icon="🏆" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Best pull + favourites */}
        <Card className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-bold">🏆 Best pull</h2>
          {profile.rarestPull ? (
            <>
              <CardTile
                card={{
                  id: profile.rarestPull.id,
                  name: profile.rarestPull.name,
                  rarity: profile.rarestPull.rarity,
                  imageSmall: profile.rarestPull.imageSmall,
                  rarityTier: rarityTier(profile.rarestPull.rarity),
                }}
                size="md"
              />
              <div>
                <div className="font-semibold">{profile.rarestPull.name}</div>
                <Badge color="gold">{profile.rarestPull.rarity}</Badge>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">No pulls yet</p>
          )}
          {(profile.favouritePokemon || profile.favouriteCard) && (
            <div className="mt-2 border-t border-border pt-3 text-sm">
              {profile.favouritePokemon && (
                <p>
                  ❤️ Favourite Pokémon: <span className="font-semibold">{profile.favouritePokemon}</span>
                </p>
              )}
              {profile.favouriteCard && (
                <p className="mt-1">
                  🎴 Favourite card: <span className="font-semibold">{profile.favouriteCard.name}</span>
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Set completion */}
        <Card>
          <h2 className="font-bold">Set completion</h2>
          {topProgress.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No progress yet.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {topProgress.map((p) => (
                <div key={p.set.id}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate font-medium">
                      {p.completedAt && "🏆 "}
                      {p.set.name}
                    </span>
                    <span className="text-muted">
                      {Math.floor((p.uniqueOwned / p.set.total) * 100)}%
                    </span>
                  </div>
                  <ProgressBar className="mt-1.5" value={p.uniqueOwned} max={p.set.total} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Achievements */}
        <Card>
          <h2 className="font-bold">Achievements · {unlocked.length}</h2>
          {unlocked.length === 0 ? (
            <p className="mt-3 text-sm text-muted">None unlocked yet.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {unlocked.slice(0, 8).map((u) => (
                <div key={u.achievementId} className="flex items-center gap-3 text-sm">
                  <span className="text-xl">{u.achievement.icon}</span>
                  <div>
                    <div className="font-medium">{u.achievement.name}</div>
                    <div className="text-xs text-muted">{u.achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Binder preview */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Showcase binder</h2>
          <Link href={`/binder/${profile.username}`} className="text-sm text-primary underline">
            Full binder →
          </Link>
        </div>
        {binderCards.length === 0 ? (
          <Card className="text-sm text-muted">Binder is empty.</Card>
        ) : (
          <div className="flex flex-wrap gap-3">
            {binderCards.map((slot) => (
              <CardTile
                key={slot.position}
                card={{
                  id: slot.card.id,
                  name: slot.card.name,
                  rarity: slot.card.rarity,
                  imageSmall: slot.card.imageSmall,
                  rarityTier: rarityTier(slot.card.rarity),
                }}
                size="sm"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

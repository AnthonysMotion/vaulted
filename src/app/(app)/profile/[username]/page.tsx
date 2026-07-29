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

  return (
    <div className="flex flex-col gap-8">
      {/* Banner + header */}
      <div className="overflow-hidden rounded-3xl border border-border">
        <div
          className="h-36 bg-gradient-to-r from-sky-500/30 via-purple-500/20 to-yellow-500/30 sm:h-44"
          style={
            profile.bannerUrl
              ? { backgroundImage: `url(${profile.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        />
        <div className="flex flex-col gap-5 bg-surface p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="-mt-16 grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-surface bg-surface-2 text-4xl shadow-xl">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                "🧢"
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black">{profile.username}</h1>
              <p className="text-sm text-muted">
                Level {profile.level} trainer · joined{" "}
                {new Date(profile.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })}
              </p>
              {profile.bio && <p className="mt-1 max-w-md text-sm">{profile.bio}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <LinkButton href={`/binder/${profile.username}`} variant="secondary" className="w-full sm:w-auto">
              View binder
            </LinkButton>
            {!isOwner && viewer && (
              <LinkButton href={`/friends?add=${profile.username}`} className="w-full sm:w-auto">Add friend</LinkButton>
            )}
          </div>
        </div>
      </div>

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

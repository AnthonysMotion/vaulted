import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { userAchievements } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getBinder,
  getProfileByUsername,
  getSetProgress,
  getUserRecentPackOpenings,
} from "@/lib/game/queries";
import { getOrCreateProfile } from "@/lib/game/profile";
import { SafeImage } from "@/components/safe-image";
import { LinkButton, ProgressBar, SectionEyebrow } from "@/components/ui";
import { BinderEditor } from "@/components/binder-editor";
import { ProfileActivityFeed } from "@/components/profile-activity-feed";
import { ProfileShowcaseCard } from "@/components/profile-showcase-card";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [progress, binder, unlocked, viewer, recentPacks] =
    await Promise.all([
      getSetProgress(profile.id),
      getBinder(profile.id),
      db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, profile.id),
        with: { achievement: true },
      }),
      getOrCreateProfile().catch(() => null),
      getUserRecentPackOpenings(profile.id, 5),
    ]);

  const cardsCollected = profile.totalCardsCollected;
  const isOwner = viewer?.id === profile.id;
  const completedSets = progress.filter((p) => p.completedAt);
  const topProgress = progress.slice(0, 4);
  const binderSlots = (binder?.slots ?? []).map((s) => ({
    position: s.position,
    cardId: s.cardId,
    name: s.card.name,
    rarity: s.card.rarity,
    imageSmall: s.card.imageSmall,
    isFavourite: s.isFavourite,
  }));

  const joinedLabel = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });

  const stats = [
    { label: "Cards collected", value: cardsCollected.toLocaleString() },
    { label: "Packs opened", value: profile.totalPacksOpened.toLocaleString() },
    { label: "Current streak", value: `${profile.currentStreak}d` },
    { label: "Sets completed", value: String(completedSets.length) },
  ];

  return (
    <div className="flex flex-col gap-16 md:gap-24">
      {/* Full-bleed banner under fixed nav */}
      <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -mt-[calc(var(--site-header-offset)+2rem)] sm:-mt-[calc(var(--site-header-offset)+2.5rem)]">
        <div className="relative isolate">
          <div
            className="relative h-[calc(var(--site-header-offset)+14rem)] overflow-hidden bg-surface sm:h-[calc(var(--site-header-offset)+18rem)] md:h-[calc(var(--site-header-offset)+22rem)]"
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
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(41,141,255,0.18),transparent_55%),linear-gradient(180deg,#131518_0%,#000_100%)]"
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20"
            />
          </div>

          <div className="mx-auto max-w-[1200px] px-4 sm:px-8 md:px-10">
            <div className="relative -mt-16 grid gap-8 pb-12 sm:-mt-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16 md:-mt-24 md:pb-16">
              <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
                <div className="relative z-10 grid h-28 w-28 shrink-0 place-items-center overflow-hidden border border-border bg-surface sm:h-32 sm:w-32 md:h-36 md:w-36">
                  <SafeImage
                    src={profile.avatarUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, 144px"
                    className="object-cover"
                    fallback={
                      <span className="font-mono text-2xl uppercase text-category">
                        {profile.username.slice(0, 1)}
                      </span>
                    }
                  />
                </div>

                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="title-m truncate text-white">
                      {profile.username}
                    </h1>
                    {profile.isDeveloper && (
                      <span className="border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-accent">
                        Dev
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted">
                    <span>Level {profile.level}</span>
                    <span aria-hidden className="text-border">
                      /
                    </span>
                    <span>Joined {joinedLabel}</span>
                    {profile.favouritePokemon ? (
                      <>
                        <span aria-hidden className="text-border">
                          /
                        </span>
                        <span>{profile.favouritePokemon}</span>
                      </>
                    ) : null}
                  </div>

                  {profile.bio ? (
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-2 sm:text-lg">
                      {profile.bio}
                    </p>
                  ) : isOwner ? (
                    <p className="mt-5 text-sm text-muted-2">
                      No bio yet.{" "}
                      <Link
                        href="/account"
                        className="text-category underline underline-offset-4 transition-colors hover:text-white"
                      >
                        Add one
                      </Link>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <LinkButton
                  href={`/binder/${profile.username}`}
                  className="h-12 w-full px-8 text-sm sm:w-auto"
                >
                  View binder{" "}
                  <span aria-hidden className="ml-2 font-normal opacity-70">
                    →
                  </span>
                </LinkButton>
                {isOwner ? (
                  <Link
                    href="/account"
                    className="text-center font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-category transition-colors hover:text-white lg:text-right"
                  >
                    Edit profile →
                  </Link>
                ) : viewer ? (
                  <LinkButton
                    href={`/friends?add=${profile.username}`}
                    variant="dark"
                    className="h-12 w-full px-8 text-sm sm:w-auto"
                  >
                    Add friend
                  </LinkButton>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section className="grid gap-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start lg:gap-20">
        <div className="flex min-w-0 flex-col gap-16">
          <div>
            <SectionEyebrow>Activity</SectionEyebrow>
            <h2 className="title-s text-white">Recent packs</h2>
            <div className="mt-8">
              <ProfileActivityFeed
                openings={recentPacks}
                username={profile.username}
              />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <SectionEyebrow>Binder</SectionEyebrow>
                <h2 className="title-s text-white">Showcase binder</h2>
                <p className="mt-3 max-w-md text-sm text-muted-2">
                  {isOwner
                    ? "Arrange the cards you want people to see first."
                    : `Cards ${profile.username} chose to put on display.`}
                </p>
              </div>
              <Link
                href={`/binder/${profile.username}`}
                className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-category transition-colors hover:text-white"
              >
                Open binder page →
              </Link>
            </div>
            <div className="mt-8">
              <BinderEditor
                initialSlots={binderSlots}
                editable={isOwner}
                align="start"
              />
            </div>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-10">
          <div>
            <SectionEyebrow>Showcase</SectionEyebrow>
            <h2 className="title-s text-white">Favourite pull</h2>
            <div className="mt-8">
              <ProfileShowcaseCard
                isOwner={isOwner}
                card={
                  profile.favouriteCard
                    ? {
                        id: profile.favouriteCard.id,
                        name: profile.favouriteCard.name,
                        rarity: profile.favouriteCard.rarity,
                        imageSmall: profile.favouriteCard.imageSmall,
                        imageLarge: profile.favouriteCard.imageLarge,
                        setName: profile.favouriteCard.set?.name ?? null,
                      }
                    : null
                }
              />
            </div>
          </div>

          <div>
            <SectionEyebrow>Progress</SectionEyebrow>
            <h2 className="title-s text-white">Set completion</h2>
            {topProgress.length === 0 ? (
              <p className="mt-6 text-sm text-muted-2">No progress yet.</p>
            ) : (
              <ul className="mt-8 divide-y divide-border border-y border-border">
                {topProgress.map((p) => (
                  <li key={p.set.id} className="py-5">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="truncate font-medium tracking-[-0.02em] text-white">
                        {p.set.name}
                      </span>
                      <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted">
                        {Math.floor((p.uniqueOwned / p.set.total) * 100)}%
                      </span>
                    </div>
                    <ProgressBar
                      className="mt-3"
                      value={p.uniqueOwned}
                      max={p.set.total}
                    />
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/collection"
              className="mt-6 inline-flex font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-category transition-colors hover:text-white"
            >
              Full collection →
            </Link>
          </div>

          <div>
            <SectionEyebrow>Milestones</SectionEyebrow>
            <h2 className="title-s text-white">
              Achievements{" "}
              <span className="text-muted-2">· {unlocked.length}</span>
            </h2>
            {unlocked.length === 0 ? (
              <p className="mt-6 text-sm text-muted-2">None unlocked yet.</p>
            ) : (
              <ul className="mt-8 divide-y divide-border border-y border-border">
                {unlocked.slice(0, 6).map((u) => (
                  <li
                    key={u.achievementId}
                    className="flex items-center gap-3 py-4"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center border border-border bg-surface text-lg">
                      {u.achievement.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium tracking-[-0.02em] text-white">
                        {u.achievement.name}
                      </div>
                      <div className="truncate text-sm text-muted-2">
                        {u.achievement.description}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/achievements"
              className="mt-6 inline-flex font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-category transition-colors hover:text-white"
            >
              All achievements →
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}

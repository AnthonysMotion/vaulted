import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getOrCreateProfile } from "@/lib/game/profile";
import {
  areFriends,
  compareCollections,
  getAllSets,
  getProfileByUsername,
} from "@/lib/game/queries";
import { rarityTier } from "@/lib/packs/rarity";
import { Card, EmptyState, ProgressBar } from "@/components/ui";
import { SectionSkeleton } from "@/components/skeletons";
import { CompareMissingList } from "@/components/compare-missing-list";

export const metadata = { title: "Compare Collections" };

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ set?: string }>;
}) {
  const [{ username }, { set: setId }] = await Promise.all([params, searchParams]);

  const mePromise = getOrCreateProfile();
  const themPromise = getProfileByUsername(username);
  const setsPromise = getAllSets();

  const me = await mePromise;
  if (!me) redirect(`/login?next=/compare/${username}`);

  const them = await themPromise;
  if (!them) notFound();
  if (them.id === me.id) redirect("/collection");

  const [friends, allSets] = await Promise.all([
    areFriends(me.id, them.id),
    setsPromise,
  ]);

  if (!friends) {
    return (
      <EmptyState icon="🔒" title="Friends only">
        You can only compare collections with friends.{" "}
        <Link href={`/friends?add=${them.username}`} className="text-primary underline">
          Send {them.username} a request
        </Link>
      </EmptyState>
    );
  }

  const selectedSetId = setId ?? "sv3pt5";
  const selectedSet = allSets.find((s) => s.id === selectedSetId) ?? allSets[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black">
          You vs <span className="text-primary">{them.username}</span>
        </h1>
        <p className="mt-1 text-muted">Set completion head-to-head.</p>
      </div>

      <form action={`/compare/${them.username}`} method="get" className="flex items-center gap-2">
        <select
          name="set"
          defaultValue={selectedSet.id}
          className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm"
        >
          {allSets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.series})
            </option>
          ))}
        </select>
        <button className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-slate-900">
          Compare
        </button>
      </form>

      <Suspense fallback={<SectionSkeleton />}>
        <CompareResults
          myUserId={me.id}
          theirUserId={them.id}
          theirUsername={them.username}
          setId={selectedSet.id}
        />
      </Suspense>
    </div>
  );
}

async function CompareResults({
  myUserId,
  theirUserId,
  theirUsername,
  setId,
}: {
  myUserId: string;
  theirUserId: string;
  theirUsername: string;
  setId: string;
}) {
  const comparison = await compareCollections(myUserId, theirUserId, setId);
  if (!comparison) return null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="text-sm text-muted">You</div>
          <div className="mt-1 text-3xl font-black text-primary">
            {Math.floor((comparison.myOwned / comparison.totalCards) * 100)}%
          </div>
          <div className="text-sm text-muted">
            {comparison.myOwned}/{comparison.totalCards} cards
          </div>
          <ProgressBar className="mt-3" value={comparison.myOwned} max={comparison.totalCards} />
        </Card>
        <Card>
          <div className="text-sm text-muted">{theirUsername}</div>
          <div className="mt-1 text-3xl font-black">
            {Math.floor((comparison.theirOwned / comparison.totalCards) * 100)}%
          </div>
          <div className="text-sm text-muted">
            {comparison.theirOwned}/{comparison.totalCards} cards
          </div>
          <ProgressBar className="mt-3" value={comparison.theirOwned} max={comparison.totalCards} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CompareMissingList
          title={`Cards you're missing · ${comparison.myMissing.length}`}
          cards={[...comparison.myMissing].sort(
            (a, b) => rarityTier(b.rarity) - rarityTier(a.rarity),
          )}
        />
        <CompareMissingList
          title={`${theirUsername} is missing · ${comparison.theirMissing.length}`}
          cards={[...comparison.theirMissing].sort(
            (a, b) => rarityTier(b.rarity) - rarityTier(a.rarity),
          )}
          highlightIds={comparison.iHaveTheyNeed.map((c) => c.id)}
          highlightLabel="You own this!"
        />
      </div>
    </>
  );
}

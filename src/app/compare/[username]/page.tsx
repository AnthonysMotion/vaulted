/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
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

export const metadata = { title: "Compare Collections" };
export const dynamic = "force-dynamic";

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ set?: string }>;
}) {
  const [{ username }, { set: setId }] = await Promise.all([params, searchParams]);

  const me = await getOrCreateProfile();
  if (!me) redirect(`/login?next=/compare/${username}`);

  const them = await getProfileByUsername(username);
  if (!them) notFound();
  if (them.id === me.id) redirect("/collection");

  const friends = await areFriends(me.id, them.id);
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

  const allSets = await getAllSets();
  const selectedSetId = setId ?? "sv3pt5";
  const selectedSet = allSets.find((s) => s.id === selectedSetId) ?? allSets[0];
  const comparison = await compareCollections(me.id, them.id, selectedSet.id);

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
        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-slate-900 cursor-pointer">
          Compare
        </button>
      </form>

      {comparison && (
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
              <div className="text-sm text-muted">{them.username}</div>
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
            <MissingList
              title={`Cards you're missing · ${comparison.myMissing.length}`}
              cards={comparison.myMissing}
            />
            <MissingList
              title={`${them.username} is missing · ${comparison.theirMissing.length}`}
              cards={comparison.theirMissing}
              highlight={new Set(comparison.iHaveTheyNeed.map((c) => c.id))}
              highlightLabel="You own this!"
            />
          </div>
        </>
      )}
    </div>
  );
}

function MissingList({
  title,
  cards,
  highlight,
  highlightLabel,
}: {
  title: string;
  cards: { id: string; name: string; rarity: string | null; number: string; imageSmall: string | null }[];
  highlight?: Set<string>;
  highlightLabel?: string;
}) {
  const sorted = [...cards].sort((a, b) => rarityTier(b.rarity) - rarityTier(a.rarity));
  return (
    <Card>
      <h2 className="font-bold">{title}</h2>
      {sorted.length === 0 ? (
        <p className="mt-3 text-sm text-emerald-400">Set complete! 🏆</p>
      ) : (
        <ul className="mt-3 flex max-h-96 flex-col gap-1.5 overflow-y-auto pr-2">
          {sorted.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-sm">
              {c.imageSmall && (
                <img src={c.imageSmall} alt="" className="h-8 rounded-sm" loading="lazy" />
              )}
              <span className="min-w-0 flex-1 truncate">
                {c.name} <span className="text-xs text-muted">#{c.number}</span>
              </span>
              <span className="text-xs text-muted">{c.rarity}</span>
              {highlight?.has(c.id) && (
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                  {highlightLabel}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

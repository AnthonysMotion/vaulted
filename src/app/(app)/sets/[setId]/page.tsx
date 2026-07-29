/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import { CardTile } from "@/components/card-tile";
import { Badge, Card, LinkButton, ProgressBar } from "@/components/ui";
import { getOrCreateProfile } from "@/lib/game/profile";
import {
  getCardsForSet,
  getOwnedCardCountsForSet,
  getSetById,
  getSetProgress,
} from "@/lib/game/queries";
import { rarityTier } from "@/lib/packs/rarity";

export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;

  const [set, profile, cards] = await Promise.all([
    getSetById(setId),
    getOrCreateProfile().catch(() => null),
    getCardsForSet(setId),
  ]);
  if (!set) notFound();

  const [progress, ownedRows] = await Promise.all([
    profile ? getSetProgress(profile.id) : Promise.resolve([]),
    profile ? getOwnedCardCountsForSet(profile.id, setId) : Promise.resolve([]),
  ]);

  const setProgress = progress.find((entry) => entry.set.id === set.id) ?? null;
  const ownedByCardId = new Map(ownedRows.map((row) => [row.cardId, row.quantity]));
  const ownedCount = setProgress?.uniqueOwned ?? ownedByCardId.size;
  const completionPct = set.total > 0 ? Math.floor((ownedCount / set.total) * 100) : 0;
  const sortedCards = [...cards].sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: "base" }),
  );

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link href="/sets" className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
            ← Back to all sets
          </Link>
          <div className="mt-8 flex items-start gap-6">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-950 p-3 shadow-xl">
              {set.logoUrl ? (
                <img src={set.logoUrl} alt={set.name} className="max-h-14 max-w-full object-contain" />
              ) : set.symbolUrl ? (
                <img src={set.symbolUrl} alt="" className="max-h-10 max-w-10 object-contain" />
              ) : (
                <span className="text-3xl text-zinc-800">🎴</span>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-tighter text-white">{set.name}</h1>
                <Badge color="gold">{set.id.toUpperCase()}</Badge>
              </div>
              <p className="mt-3 text-zinc-500 font-medium">
                {set.series} Series · {set.releaseDate.split("-")[0]} · {set.total} cards
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <LinkButton href={`/open-pack/${set.id}?mode=sandbox`} variant="dark" className="h-12 px-6">
            Open Sandbox
          </LinkButton>
          <LinkButton
            href={profile ? `/open-pack/${set.id}?mode=trainer` : `/login?next=/open-pack/${set.id}%3Fmode%3Dtrainer`}
            variant="primary"
            className="h-12 px-6"
          >
            {profile ? "Open Trainer Pack" : "Sign In to Open"}
          </LinkButton>
        </div>
      </div>

      <div className="grid gap-px bg-zinc-900 border border-zinc-900 rounded-xl overflow-hidden md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-black p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">Completion</span>
            <span className="text-sm font-black text-white">
              {ownedCount} / {set.total}
            </span>
          </div>
          <ProgressBar value={ownedCount} max={set.total} className="h-1" />
          <div className="mt-2 text-[10px] font-bold text-zinc-700 text-right uppercase tracking-widest">
            {completionPct}% Complete
          </div>
        </div>

        <div className="bg-black p-8 flex flex-col justify-center">
          <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-2">Metadata</div>
          <div className="flex flex-wrap gap-2">
            <Badge>{set.printedTotal} Printed</Badge>
            <Badge>{cards.length} Indexed</Badge>
            {setProgress?.completedAt && <Badge color="gold">🏆 Mastered</Badge>}
          </div>
        </div>

        <div className="bg-black p-8 flex flex-col justify-center lg:col-span-1 md:col-span-2">
          {!profile ? (
            <Link href="/login" className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest">
              Sign in to track progress →
            </Link>
          ) : (
            <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
              ✓ Tracking collection
            </div>
          )}
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-10 flex items-end justify-between border-b border-zinc-900 pb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Card Gallery</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Checklist for {set.name}. Owned cards show quantities.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {sortedCards.map((card) => (
            <div key={card.id} className="group flex flex-col gap-3">
              <div className="relative aspect-[63/88] w-full transition-transform duration-300 group-hover:-translate-y-1">
                <CardTile
                  card={{
                    id: card.id,
                    name: card.name,
                    rarity: card.rarity,
                    imageSmall: card.imageSmall,
                    imageLarge: card.imageLarge,
                    rarityTier: rarityTier(card.rarity),
                    quantity: ownedByCardId.get(card.id),
                  }}
                  size="lg"
                />
              </div>
              <div className="px-1">
                <div className="truncate text-xs font-bold text-white mb-1">{card.name}</div>
                <div className="flex items-center justify-between">
                   <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">
                    #{card.number}
                  </div>
                  {card.rarity && (
                    <div className="text-[9px] font-bold text-zinc-600 uppercase">
                      {card.rarity.split(" ").pop()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

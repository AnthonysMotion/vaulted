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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link href="/sets" className="text-sm text-muted hover:text-foreground">
            ← All expansions
          </Link>
          <div className="mt-4 flex items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-border bg-surface p-2">
              {set.logoUrl ? (
                <img src={set.logoUrl} alt={set.name} className="max-h-12 max-w-full object-contain" />
              ) : set.symbolUrl ? (
                <img src={set.symbolUrl} alt="" className="max-h-10 max-w-10 object-contain" />
              ) : (
                <span className="text-2xl">🎴</span>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="title-m">{set.name}</h1>
                <Badge>{set.id.toUpperCase()}</Badge>
              </div>
              <p className="mt-2 text-muted">
                {set.series} · {set.releaseDate} · {set.total} cards
              </p>
              <p className="mt-3 max-w-2xl text-sm text-muted">
                Browse the full checklist first, then jump into opening packs when you are
                ready.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <LinkButton href={`/open-pack/${set.id}?mode=sandbox`}>Open sandbox pack</LinkButton>
          <LinkButton
            href={profile ? `/open-pack/${set.id}?mode=trainer` : `/login?next=/open-pack/${set.id}%3Fmode%3Dtrainer`}
            variant="secondary"
          >
            {profile ? "Open trainer pack" : "Sign in for trainer mode"}
          </LinkButton>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Set checklist</span>
            <span className="text-muted">
              {ownedCount}/{set.total} owned{profile ? ` · ${completionPct}%` : ""}
            </span>
          </div>
          <ProgressBar className="mt-2" value={ownedCount} max={set.total} />
        </Card>

        <Card>
          <div className="flex flex-wrap gap-2">
            <Badge>{set.printedTotal} printed</Badge>
            <Badge>{cards.length} imported</Badge>
            {setProgress?.completedAt && <Badge color="gold">Completed</Badge>}
            {!profile && <Badge color="blue">Sign in to track ownership</Badge>}
          </div>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Cards in this set</h2>
            <p className="text-sm text-muted">
              Sorted by card number. Owned cards show a quantity badge when available.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {sortedCards.map((card) => (
            <div key={card.id} className="flex flex-col gap-2">
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
                size="md"
              />
              <div className="px-1">
                <div className="truncate text-sm font-semibold">{card.name}</div>
                <div className="text-xs text-muted">
                  #{card.number}
                  {card.rarity ? ` · ${card.rarity}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

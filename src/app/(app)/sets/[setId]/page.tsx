import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CatalogImage } from "@/components/catalog-image";
import { SetCardGallery } from "@/components/set-card-gallery";
import { Badge, LinkButton, ProgressBar } from "@/components/ui";
import { GallerySkeleton } from "@/components/skeletons";
import { getOrCreateProfile } from "@/lib/game/profile";
import {
  getCardsForSet,
  getCollectionForSet,
  getOwnedCardCountsForSet,
  getSetById,
} from "@/lib/game/queries";
import { rarityTier } from "@/lib/packs/rarity";

export default async function SetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ card?: string }>;
}) {
  const [{ setId }, { card: focusCardId }] = await Promise.all([
    params,
    searchParams,
  ]);

  const [set, profile] = await Promise.all([
    getSetById(setId),
    getOrCreateProfile().catch(() => null),
  ]);
  if (!set) notFound();

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link href="/sets" className="text-xs font-bold uppercase tracking-widest text-muted-2 transition-colors hover:text-white">
            ← Back to all sets
          </Link>
          <div className="mt-8 flex items-start gap-6">
            <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden border border-border bg-surface shadow-xl">
              <CatalogImage
                src={set.logoUrl ?? set.symbolUrl}
                alt={set.logoUrl ? set.name : ""}
                fill
                sizes="80px"
                className="object-contain p-3"
                fallback={<span className="text-3xl text-zinc-800">🎴</span>}
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-tighter text-white">{set.name}</h1>
                <Badge color="gold">{set.id.toUpperCase()}</Badge>
              </div>
              <p className="mt-3 font-medium text-muted-2">
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

      <Suspense fallback={<div className="h-40 animate-pulse border border-border bg-surface/50" />}>
        <SetProgressStats set={set} userId={profile?.id ?? null} />
      </Suspense>

      <section className="mt-8">
        <div className="mb-10 flex items-end justify-between border-b border-border pb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Card Gallery</h2>
            <p className="mt-1 text-sm text-muted-2">
              Checklist for {set.name}. Owned cards show quantities.
            </p>
          </div>
        </div>

        <Suspense fallback={<GallerySkeleton count={15} />}>
          <SetGallery
            setId={set.id}
            userId={profile?.id ?? null}
            focusCardId={focusCardId ?? null}
          />
        </Suspense>
      </section>
    </div>
  );
}

async function SetProgressStats({
  set,
  userId,
}: {
  set: { id: string; total: number; printedTotal: number };
  userId: string | null;
}) {
  const progress = userId ? await getCollectionForSet(userId, set.id) : null;
  const ownedCount = progress?.uniqueOwned ?? 0;
  const completionPct = set.total > 0 ? Math.floor((ownedCount / set.total) * 100) : 0;

  return (
    <div className="grid gap-px overflow-hidden border border-border bg-surface-2 md:grid-cols-2 lg:grid-cols-3">
      <div className="bg-black p-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-2">Completion</span>
          <span className="text-sm font-black text-white">
            {ownedCount} / {set.total}
          </span>
        </div>
        <ProgressBar value={ownedCount} max={set.total} className="h-1" />
        <div className="mt-2 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-700">
          {completionPct}% Complete
        </div>
      </div>

      <div className="flex flex-col justify-center bg-black p-8">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-2">Metadata</div>
        <div className="flex flex-wrap gap-2">
          <Badge>{set.printedTotal} Printed</Badge>
          <Badge>{set.total} Indexed</Badge>
          {progress?.completedAt && <Badge color="gold">🏆 Mastered</Badge>}
        </div>
      </div>

      <div className="flex flex-col justify-center bg-black p-8 md:col-span-2 lg:col-span-1">
        {!userId ? (
          <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-blue-500 transition-colors hover:text-blue-400">
            Sign in to track progress →
          </Link>
        ) : (
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            ✓ Tracking collection
          </div>
        )}
      </div>
    </div>
  );
}

async function SetGallery({
  setId,
  userId,
  focusCardId,
}: {
  setId: string;
  userId: string | null;
  focusCardId: string | null;
}) {
  const [cards, ownedRows] = await Promise.all([
    getCardsForSet(setId),
    userId ? getOwnedCardCountsForSet(userId, setId) : Promise.resolve([]),
  ]);

  const ownedByCardId = new Map(ownedRows.map((row) => [row.cardId, row.quantity]));
  const sortedCards = [...cards].sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: "base" }),
  );

  return (
    <SetCardGallery
      initialCardId={
        focusCardId && cards.some((c) => c.id === focusCardId)
          ? focusCardId
          : null
      }
      cards={sortedCards.map((card) => ({
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: card.rarity,
        imageSmall: card.imageSmall,
        rarityTier: rarityTier(card.rarity),
        quantity: ownedByCardId.get(card.id),
      }))}
    />
  );
}

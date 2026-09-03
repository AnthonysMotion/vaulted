import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getOrCreateProfile } from "@/lib/game/profile";
import { redirectIfNeedsOnboarding } from "@/lib/game/onboarding";
import {
  getAllSets,
  getCollectionForSet,
  getCollectionSummary,
  getSetById,
  getUserCollection,
  type CollectionFilters,
} from "@/lib/game/queries";
import { rarityTier } from "@/lib/packs/rarity";
import { CollectionCardGallery } from "@/components/collection-card-gallery";
import { SelectMenu } from "@/components/select-menu";
import { Badge, EmptyState, ProgressBar, SectionEyebrow } from "@/components/ui";
import { GallerySkeleton, SectionSkeleton } from "@/components/skeletons";

export const metadata = { title: "My Collection" };

const RARITY_OPTIONS = [
  "Common",
  "Uncommon",
  "Rare",
  "Rare Holo",
  "Double Rare",
  "Ultra Rare",
  "Illustration Rare",
  "Special Illustration Rare",
  "Hyper Rare",
  "Rare Secret",
  "Rare Rainbow",
];

type Search = {
  set?: string;
  rarity?: string;
  type?: string;
  q?: string;
  page?: string;
};

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/login?next=/collection");
  redirectIfNeedsOnboarding(profile);

  const sp = await searchParams;
  const filters: CollectionFilters = {
    setId: sp.set,
    rarity: sp.rarity,
    type: sp.type,
    search: sp.q,
    page: sp.page ? Number(sp.page) : 1,
  };

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <Suspense fallback={<SectionSkeleton />}>
        <CollectionIntro userId={profile.id} filters={filters} sp={sp} />
      </Suspense>
      <Suspense fallback={<GallerySkeleton count={10} />}>
        <CollectionResults userId={profile.id} filters={filters} sp={sp} />
      </Suspense>
    </div>
  );
}

function buildUrl(sp: Search, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  const merged = { set: sp.set, rarity: sp.rarity, type: sp.type, q: sp.q, ...patch };
  for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
  const qs = params.toString();
  return `/collection${qs ? `?${qs}` : ""}`;
}

async function CollectionIntro({
  userId,
  filters,
  sp,
}: {
  userId: string;
  filters: CollectionFilters;
  sp: Search;
}) {
  const [summary, allSets, selectedSet, selectedProgress] = await Promise.all([
    getCollectionSummary(userId),
    getAllSets(),
    filters.setId ? getSetById(filters.setId) : Promise.resolve(null),
    filters.setId ? getCollectionForSet(userId, filters.setId) : Promise.resolve(null),
  ]);

  const selectedSetProgress =
    selectedSet && selectedProgress
      ? { set: selectedSet, uniqueOwned: selectedProgress.uniqueOwned }
      : null;

  return (
    <>
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <SectionEyebrow>Vault</SectionEyebrow>
          <h1 className="mt-4 text-4xl font-black tracking-tighter text-white sm:text-5xl">Your collection.</h1>
          <p className="mt-4 font-medium text-muted-2">
            {summary.unique.toLocaleString()} unique cards indexed from your packs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.rarityDistribution
            .sort((a, b) => rarityTier(b.rarity) - rarityTier(a.rarity))
            .map((r) => (
              <Link key={r.rarity ?? "none"} href={buildUrl(sp, { rarity: r.rarity ?? undefined, page: undefined })}>
                <Badge color={rarityTier(r.rarity) >= 6 ? "pink" : rarityTier(r.rarity) >= 5 ? "gold" : rarityTier(r.rarity) >= 4 ? "purple" : "default"}>
                  {r.rarity ?? "-"} · {r.unique}
                </Badge>
              </Link>
            ))}
        </div>
      </div>

      {selectedSetProgress && (
        <div className="border border-border bg-surface p-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold tracking-tight text-white">{selectedSetProgress.set.name}</span>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">Completion</div>
            </div>
            <span className="text-sm font-black text-white">
              {selectedSetProgress.uniqueOwned}/{selectedSetProgress.set.total} ({Math.floor((selectedSetProgress.uniqueOwned / selectedSetProgress.set.total) * 100)}%)
            </span>
          </div>
          <ProgressBar
            className="h-1"
            value={selectedSetProgress.uniqueOwned}
            max={selectedSetProgress.set.total}
          />
        </div>
      )}

      <div className="sticky top-4 z-20 border border-border bg-black/80 p-4 backdrop-blur-xl md:top-28 md:p-6">
        <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3" action="/collection" method="get">
          <div className="min-w-[200px] flex-1">
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search by card name..."
              className="h-12 w-full border border-border bg-surface px-4 text-sm text-white outline-none transition-colors placeholder:text-muted-2 focus:border-zinc-600"
            />
          </div>
          <SelectMenu
            name="set"
            defaultValue={sp.set ?? ""}
            emptyLabel="All sets"
            className="w-full sm:w-56"
            options={allSets.map((s) => ({ value: s.id, label: s.name }))}
          />
          <SelectMenu
            name="rarity"
            defaultValue={sp.rarity ?? ""}
            emptyLabel="All rarities"
            className="w-full sm:w-48"
            options={RARITY_OPTIONS.map((r) => ({ value: r, label: r }))}
          />
          <button
            type="submit"
            className="h-12 bg-white px-6 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200"
          >
            Filter
          </button>
          {(sp.set || sp.rarity || sp.type || sp.q) && (
            <Link href="/collection" className="text-[10px] font-bold uppercase tracking-widest text-muted-2 transition-colors hover:text-white">
              Clear
            </Link>
          )}
        </form>
      </div>
    </>
  );
}

async function CollectionResults({
  userId,
  filters,
  sp,
}: {
  userId: string;
  filters: CollectionFilters;
  sp: Search;
}) {
  const collection = await getUserCollection(userId, filters);
  const totalPages = Math.max(1, Math.ceil(collection.total / collection.pageSize));

  if (collection.rows.length === 0) {
    return <EmptyState icon="🎴" title="Nothing found in the vault" />;
  }

  return (
    <div>
      <CollectionCardGallery
        cards={collection.rows.map((row) => ({
          id: row.card.id,
          name: row.card.name,
          rarity: row.card.rarity,
          imageSmall: row.card.imageSmall,
          rarityTier: rarityTier(row.card.rarity),
          quantity: row.quantity,
          setCode: row.card.id.split("-")[0].toUpperCase(),
          number: row.card.number,
        }))}
      />

      {totalPages > 1 && (
        <div className="mt-20 flex items-center justify-center gap-8 border-t border-border py-10">
          {collection.page > 1 && (
            <Link href={buildUrl(sp, { page: String(collection.page - 1) })} className="text-xs font-bold uppercase tracking-widest text-muted-2 hover:text-white transition-colors">
              ← Prev
            </Link>
          )}
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">
            {collection.page} / {totalPages}
          </span>
          {collection.page < totalPages && (
            <Link href={buildUrl(sp, { page: String(collection.page + 1) })} className="text-xs font-bold uppercase tracking-widest text-muted-2 hover:text-white transition-colors">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateProfile } from "@/lib/game/profile";
import { redirectIfNeedsOnboarding } from "@/lib/game/onboarding";
import {
  getAllSets,
  getCollectionSummary,
  getSetProgress,
  getUserCollection,
} from "@/lib/game/queries";
import { rarityTier } from "@/lib/packs/rarity";
import { CollectionCardGallery } from "@/components/collection-card-gallery";
import { Badge, Card, EmptyState, ProgressBar, SectionEyebrow } from "@/components/ui";

export const metadata = { title: "My Collection" };
export const dynamic = "force-dynamic";

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

const TYPE_OPTIONS = [
  "Grass", "Fire", "Water", "Lightning", "Psychic",
  "Fighting", "Darkness", "Metal", "Dragon", "Fairy", "Colorless",
];

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ set?: string; rarity?: string; type?: string; q?: string; page?: string }>;
}) {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/login?next=/collection");
  redirectIfNeedsOnboarding(profile);

  const sp = await searchParams;
  const filters = {
    setId: sp.set,
    rarity: sp.rarity,
    type: sp.type,
    search: sp.q,
    page: sp.page ? Number(sp.page) : 1,
  };

  const [collection, summary, progress, allSets] = await Promise.all([
    getUserCollection(profile.id, filters),
    getCollectionSummary(profile.id),
    getSetProgress(profile.id),
    getAllSets(),
  ]);

  const selectedSetProgress = filters.setId
    ? progress.find((p) => p.set.id === filters.setId)
    : null;

  const buildUrl = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { set: sp.set, rarity: sp.rarity, type: sp.type, q: sp.q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return `/collection${qs ? `?${qs}` : ""}`;
  };

  const totalPages = Math.max(1, Math.ceil(collection.total / collection.pageSize));

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <SectionEyebrow>Vault</SectionEyebrow>
          <h1 className="mt-4 text-4xl font-black tracking-tighter text-white sm:text-5xl">Your collection.</h1>
          <p className="mt-4 text-zinc-500 font-medium">
            {summary.unique.toLocaleString()} unique cards indexed from your packs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.rarityDistribution
            .sort((a, b) => rarityTier(b.rarity) - rarityTier(a.rarity))
            .map((r) => (
              <Link key={r.rarity ?? "none"} href={buildUrl({ rarity: r.rarity ?? undefined, page: undefined })}>
                <Badge color={rarityTier(r.rarity) >= 6 ? "pink" : rarityTier(r.rarity) >= 5 ? "gold" : rarityTier(r.rarity) >= 4 ? "purple" : "default"}>
                  {r.rarity ?? "—"} · {r.unique}
                </Badge>
              </Link>
            ))}
        </div>
      </div>

      {selectedSetProgress && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white tracking-tight">{selectedSetProgress.set.name}</span>
              <div className="text-[10px] uppercase font-black text-zinc-700 tracking-[0.2em]">Completion</div>
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

      <div className="sticky top-4 z-20 rounded-xl border border-zinc-900 bg-black/80 p-4 shadow-2xl backdrop-blur-xl md:top-28 md:p-6">
        <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4" action="/collection" method="get">
          <div className="min-w-[200px] flex-1">
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search by card name..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <select
            name="set"
            defaultValue={sp.set ?? ""}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 outline-none sm:w-auto"
          >
            <option value="">All Sets</option>
            {allSets.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            name="rarity"
            defaultValue={sp.rarity ?? ""}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 outline-none sm:w-auto"
          >
            <option value="">All Rarities</option>
            {RARITY_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button className="h-10 rounded-lg bg-white px-6 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-zinc-200 cursor-pointer sm:h-9">
            Filter
          </button>
          {(sp.set || sp.rarity || sp.type || sp.q) && (
            <Link href="/collection" className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
              Clear
            </Link>
          )}
        </form>
      </div>

      <div>
        {collection.rows.length === 0 ? (
          <EmptyState icon="🎴" title="Nothing found in the vault" />
        ) : (
          <>
            <CollectionCardGallery
              cards={collection.rows.map((row) => ({
                id: row.card.id,
                name: row.card.name,
                rarity: row.card.rarity,
                imageSmall: row.card.imageSmall,
                imageLarge: row.card.imageLarge,
                rarityTier: rarityTier(row.card.rarity),
                quantity: row.quantity,
                setCode: row.card.id.split("-")[0].toUpperCase(),
                number: row.card.number,
              }))}
            />

            {totalPages > 1 && (
              <div className="mt-20 flex items-center justify-center gap-8 py-10 border-t border-zinc-900">
                {collection.page > 1 && (
                  <Link href={buildUrl({ page: String(collection.page - 1) })} className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
                    ← Prev
                  </Link>
                )}
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">
                  {collection.page} / {totalPages}
                </span>
                {collection.page < totalPages && (
                  <Link href={buildUrl({ page: String(collection.page + 1) })} className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
                    Next →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

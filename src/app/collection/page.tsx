import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateProfile } from "@/lib/game/profile";
import {
  getAllSets,
  getCollectionSummary,
  getSetProgress,
  getUserCollection,
} from "@/lib/game/queries";
import { rarityTier } from "@/lib/packs/rarity";
import { CardTile } from "@/components/card-tile";
import { Badge, Card, EmptyState, ProgressBar } from "@/components/ui";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black">My collection</h1>
        <p className="mt-1 text-muted">
          {summary.unique.toLocaleString()} unique cards ·{" "}
          {(summary.copies ?? 0).toLocaleString()} total copies
        </p>
      </div>

      {/* Rarity distribution */}
      <div className="flex flex-wrap gap-2">
        {summary.rarityDistribution
          .sort((a, b) => rarityTier(b.rarity) - rarityTier(a.rarity))
          .map((r) => (
            <Link key={r.rarity ?? "none"} href={buildUrl({ rarity: r.rarity ?? undefined, page: undefined })}>
              <Badge color={rarityTier(r.rarity) >= 5 ? "gold" : rarityTier(r.rarity) >= 4 ? "purple" : "default"}>
                {r.rarity ?? "Unknown"}: {r.unique}
              </Badge>
            </Link>
          ))}
      </div>

      {selectedSetProgress && (
        <Card>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{selectedSetProgress.set.name} completion</span>
            <span className="text-muted">
              {selectedSetProgress.uniqueOwned}/{selectedSetProgress.set.total} (
              {Math.floor((selectedSetProgress.uniqueOwned / selectedSetProgress.set.total) * 100)}%)
            </span>
          </div>
          <ProgressBar
            className="mt-2"
            value={selectedSetProgress.uniqueOwned}
            max={selectedSetProgress.set.total}
          />
        </Card>
      )}

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-3" action="/collection" method="get">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Search
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Card name..."
            className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Set
          <select
            name="set"
            defaultValue={sp.set ?? ""}
            className="max-w-52 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
          >
            <option value="">All sets</option>
            {allSets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.series})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Rarity
          <select
            name="rarity"
            defaultValue={sp.rarity ?? ""}
            className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
          >
            <option value="">All rarities</option>
            {RARITY_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Type
          <select
            name="type"
            defaultValue={sp.type ?? ""}
            className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
          >
            <option value="">All types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-slate-900 cursor-pointer">
          Filter
        </button>
        {(sp.set || sp.rarity || sp.type || sp.q) && (
          <Link href="/collection" className="py-2 text-sm text-muted underline">
            Clear
          </Link>
        )}
      </form>

      {/* Cards */}
      {collection.rows.length === 0 ? (
        <EmptyState icon="🎴" title="No cards found">
          {collection.total === 0 && !sp.set && !sp.q
            ? "Open Trainer Mode packs to start your collection!"
            : "Try different filters."}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {collection.rows.map((row) => (
            <CardTile
              key={row.cardId}
              card={{
                id: row.card.id,
                name: row.card.name,
                rarity: row.card.rarity,
                imageSmall: row.card.imageSmall,
                rarityTier: rarityTier(row.card.rarity),
                quantity: row.quantity,
              }}
              size="md"
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm">
          {collection.page > 1 && (
            <Link href={buildUrl({ page: String(collection.page - 1) })} className="text-primary underline">
              ← Previous
            </Link>
          )}
          <span className="text-muted">
            Page {collection.page} of {totalPages}
          </span>
          {collection.page < totalPages && (
            <Link href={buildUrl({ page: String(collection.page + 1) })} className="text-primary underline">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

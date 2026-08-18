import Link from "next/link";
import { Suspense } from "react";
import { getAllSets, getSetProgress } from "@/lib/game/queries";
import { getOrCreateProfile } from "@/lib/game/profile";
import { CatalogImage } from "@/components/catalog-image";
import { Badge, ProgressBar } from "@/components/ui";
import { SectionSkeleton } from "@/components/skeletons";

export const metadata = { title: "Sets" };

export default async function SetsPage() {
  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-white">Expansions</h1>
        <p className="mt-4 max-w-md text-muted-2">
          Explore every set from the 1999 Base Set to today.
        </p>
      </div>
      <Suspense fallback={<SectionSkeleton />}>
        <SetsGrid />
      </Suspense>
    </div>
  );
}

async function SetsGrid() {
  const profilePromise = getOrCreateProfile().catch(() => null);
  const setsPromise = getAllSets();
  const profile = await profilePromise;
  const [allSets, progress] = await Promise.all([
    setsPromise,
    profile ? getSetProgress(profile.id) : Promise.resolve([]),
  ]);

  const progressBySet = new Map<string, { owned: number; completed: boolean }>();
  for (const p of progress) {
    progressBySet.set(p.set.id, {
      owned: p.uniqueOwned,
      completed: Boolean(p.completedAt),
    });
  }

  const bySeries = new Map<string, typeof allSets>();
  for (const s of allSets) {
    const list = bySeries.get(s.series) ?? [];
    list.push(s);
    bySeries.set(s.series, list);
  }

  return (
    <>
      {profile && (
        <p className="-mt-8 text-sm text-muted-2">
          Your collection progress is tracked automatically.
        </p>
      )}
      {[...bySeries.entries()].map(([series, seriesSets]) => (
        <section key={series}>
          <div className="mb-6 flex items-center gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted">
              {series}
            </h2>
            <div className="h-px flex-1 bg-surface-2" />
            <Badge>{seriesSets.length}</Badge>
          </div>
          <div className="grid gap-px overflow-hidden border border-border bg-surface-2 sm:grid-cols-2 lg:grid-cols-3">
            {seriesSets.map((s) => {
              const prog = progressBySet.get(s.id);
              return (
                <Link
                  key={s.id}
                  href={`/sets/${s.id}`}
                  className="group flex items-center gap-4 bg-black p-6 transition-all hover:bg-surface"
                >
                  <div className="relative grid h-12 w-12 shrink-0 place-items-center border border-border bg-surface-2/50 transition-colors group-hover:border-border">
                    <CatalogImage
                      src={s.logoUrl ?? s.symbolUrl}
                      alt={s.logoUrl ? s.name : ""}
                      fill
                      sizes="48px"
                      className="object-contain p-1.5 transition-transform group-hover:scale-110"
                      fallback={<span className="text-xl">🎴</span>}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-white transition-colors group-hover:text-white">{s.name}</span>
                      {prog?.completed && <span title="Completed" className="text-xs">🏆</span>}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-2">
                      {s.releaseDate.split("-")[0]} · {s.total} cards
                    </div>
                    {prog && (
                      <div className="mt-3">
                        <ProgressBar value={prog.owned} max={s.total} className="h-1" />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { getAllSets, getSetProgress } from "@/lib/game/queries";
import { getOrCreateProfile } from "@/lib/game/profile";
import { Badge, ProgressBar } from "@/components/ui";

export const metadata = { title: "Sets" };
export const dynamic = "force-dynamic";

export default async function SetsPage() {
  const [allSets, profile] = await Promise.all([
    getAllSets(),
    getOrCreateProfile().catch(() => null),
  ]);

  const progressBySet = new Map<string, { owned: number; completed: boolean }>();
  if (profile) {
    const progress = await getSetProgress(profile.id);
    for (const p of progress) {
      progressBySet.set(p.set.id, {
        owned: p.uniqueOwned,
        completed: Boolean(p.completedAt),
      });
    }
  }

  const bySeries = new Map<string, typeof allSets>();
  for (const s of allSets) {
    const list = bySeries.get(s.series) ?? [];
    list.push(s);
    bySeries.set(s.series, list);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black">All expansions</h1>
        <p className="mt-1 text-muted">
          {allSets.length} sets from Base Set to today.
          {profile && " Your completion shows on each set."}
        </p>
      </div>

      {[...bySeries.entries()].map(([series, seriesSets]) => (
        <section key={series}>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            {series} <Badge>{seriesSets.length}</Badge>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {seriesSets.map((s) => {
              const prog = progressBySet.get(s.id);
              return (
                <Link
                  key={s.id}
                  href={`/open-pack/${s.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center">
                    {s.symbolUrl ? (
                      <img src={s.symbolUrl} alt="" className="max-h-10 max-w-10" loading="lazy" />
                    ) : (
                      <span>🎴</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{s.name}</span>
                      {prog?.completed && <span title="Completed">🏆</span>}
                    </div>
                    <div className="text-xs text-muted">
                      {s.releaseDate} · {s.total} cards
                    </div>
                    {prog && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <ProgressBar value={prog.owned} max={s.total} className="h-1.5" />
                        <span className="whitespace-nowrap text-[10px] text-muted">
                          {Math.floor((prog.owned / s.total) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

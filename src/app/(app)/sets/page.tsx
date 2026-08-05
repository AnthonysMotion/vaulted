import Link from "next/link";
import { getAllSets, getSetProgress } from "@/lib/game/queries";
import { getOrCreateProfile } from "@/lib/game/profile";
import { SafeImage } from "@/components/safe-image";
import { Badge, ProgressBar, Card } from "@/components/ui";

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
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-white">Expansions</h1>
        <p className="mt-4 text-zinc-500 max-w-md">
          Explore {allSets.length} sets from the 1999 Base Set to today.
          {profile && " Your collection progress is tracked automatically."}
        </p>
      </div>

      {[...bySeries.entries()].map(([series, seriesSets]) => (
        <section key={series}>
          <div className="mb-6 flex items-center gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
              {series}
            </h2>
            <div className="h-px flex-1 bg-zinc-900" />
            <Badge>{seriesSets.length}</Badge>
          </div>
          <div className="grid gap-px bg-zinc-900 border border-zinc-900 rounded-xl overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
            {seriesSets.map((s) => {
              const prog = progressBySet.get(s.id);
              return (
                <Link
                  key={s.id}
                  href={`/sets/${s.id}`}
                  className="group flex items-center gap-4 bg-black p-6 transition-all hover:bg-zinc-950"
                >
                  <div className="relative grid h-12 w-12 shrink-0 place-items-center bg-zinc-900/50 rounded-lg border border-zinc-800 transition-colors group-hover:border-zinc-700">
                    <SafeImage
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
                      <span className="truncate font-bold text-white group-hover:text-white transition-colors">{s.name}</span>
                      {prog?.completed && <span title="Completed" className="text-xs">🏆</span>}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mt-1">
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
    </div>
  );
}

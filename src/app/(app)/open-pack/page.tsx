/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { getAllSets } from "@/lib/game/queries";
import { getOrCreateProfile } from "@/lib/game/profile";
import { DAILY_PACK_LIMIT } from "@/lib/game/open-pack";
import { Badge } from "@/components/ui";

export const metadata = { title: "Open Packs" };
export const revalidate = 3600;

export default async function OpenPackPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode: rawMode } = await searchParams;
  const profile = await getOrCreateProfile().catch(() => null);
  const mode = rawMode === "trainer" && profile ? "trainer" : "sandbox";

  const allSets = await getAllSets();
  const bySeries = new Map<string, typeof allSets>();
  for (const s of allSets) {
    const list = bySeries.get(s.series) ?? [];
    list.push(s);
    bySeries.set(s.series, list);
  }

  const today = new Date().toISOString().slice(0, 10);
  const packsUsed =
    profile && profile.lastPackDate === today ? profile.packsOpenedToday : 0;

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mwg-label text-muted">Choose your booster</p>
          <h1 className="title-l mt-3">Open packs</h1>
          <p className="mt-3 max-w-md text-muted">
            {mode === "sandbox"
              ? "Sandbox — unlimited packs, nothing is saved."
              : `Trainer — ${Math.max(0, DAILY_PACK_LIMIT - packsUsed)} of ${DAILY_PACK_LIMIT} packs left today. Cards are saved forever.`}
          </p>
        </div>
        <div className="flex rounded-full bg-surface p-1 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <Link
            href="/open-pack?mode=sandbox"
            className={`mwg-label rounded-full px-5 py-3 ${mode === "sandbox" ? "bg-primary text-ink" : "text-muted hover:text-foreground"}`}
          >
            Sandbox
          </Link>
          <Link
            href={profile ? "/open-pack?mode=trainer" : "/login?next=/open-pack%3Fmode%3Dtrainer"}
            className={`mwg-label rounded-full px-5 py-3 ${mode === "trainer" ? "bg-primary text-ink" : "text-muted hover:text-foreground"}`}
          >
            Trainer
          </Link>
        </div>
      </div>

      {[...bySeries.entries()].map(([series, seriesSets]) => (
        <section key={series}>
          <h2 className="mb-4 flex items-center gap-3 title-s">
            {series} <Badge>{seriesSets.length}</Badge>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {seriesSets.map((s) => (
              <Link
                key={s.id}
                href={`/open-pack/${s.id}?mode=${mode}`}
                className="group flex flex-col items-center gap-3 rounded-[20px] border border-border bg-surface p-5 transition-all hover:bg-white hover:shadow-[0_12px_40px_rgba(10,10,11,0.06)]"
              >
                <div className="grid h-16 w-full place-items-center">
                  {s.logoUrl ? (
                    <img
                      src={s.logoUrl}
                      alt={s.name}
                      loading="lazy"
                      className="max-h-16 max-w-full object-contain transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <span className="font-bold">{s.name}</span>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-xs text-muted">
                    {s.releaseDate.slice(0, 4)} · {s.total} cards
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

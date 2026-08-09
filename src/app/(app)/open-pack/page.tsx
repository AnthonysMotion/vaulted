import Link from "next/link";
import { getAllSets } from "@/lib/game/queries";
import { getOrCreateProfile } from "@/lib/game/profile";
import { redirectIfNeedsOnboarding } from "@/lib/game/onboarding";
import { DAILY_PACK_LIMIT } from "@/lib/game/constants";
import { packsRemainingToday, resolvePackMode } from "@/lib/game/pack-mode";
import { COMPANION_ONLY_SET_IDS } from "@/lib/packs/companions";
import { CatalogImage } from "@/components/catalog-image";
import { Badge } from "@/components/ui";

export const metadata = { title: "Open Packs" };

export default async function OpenPackPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode: rawMode } = await searchParams;
  const [profile, catalogSets] = await Promise.all([
    getOrCreateProfile().catch(() => null),
    getAllSets(),
  ]);
  const packsLeft = profile ? packsRemainingToday(profile) : 0;
  const mode = resolvePackMode(rawMode, profile);
  if (mode === "trainer") redirectIfNeedsOnboarding(profile);

  const allSets = catalogSets.filter(
    (s) => !COMPANION_ONLY_SET_IDS.has(s.id),
  );
  const bySeries = new Map<string, typeof allSets>();
  for (const s of allSets) {
    const list = bySeries.get(s.series) ?? [];
    list.push(s);
    bySeries.set(s.series, list);
  }

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-zinc-800" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Pick your booster
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white sm:text-5xl">
            Rip packs.
          </h1>
          <p className="mt-6 text-zinc-500 leading-relaxed font-medium">
            {mode === "sandbox"
              ? "Sandbox mode — test your luck with unlimited packs. No cards are saved to your collection."
              : `Trainer mode — earn real progress. You have ${packsLeft} of ${DAILY_PACK_LIMIT} packs remaining for today.`}
          </p>
        </div>
        <div className="flex w-full rounded-xl border border-zinc-800 bg-black p-1 shadow-2xl sm:w-auto">
          <Link
            href="/open-pack?mode=sandbox"
            className={`flex-1 rounded-lg px-6 py-2.5 text-center text-xs font-bold uppercase tracking-widest transition-all ${mode === "sandbox" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"}`}
          >
            Sandbox
          </Link>
          <Link
            href={
              profile
                ? "/open-pack?mode=trainer"
                : "/login?next=/open-pack%3Fmode%3Dtrainer"
            }
            className={`flex-1 rounded-lg px-6 py-2.5 text-center text-xs font-bold uppercase tracking-widest transition-all ${mode === "trainer" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"}`}
          >
            Trainer
          </Link>
        </div>
      </div>

      {[...bySeries.entries()].map(([series, seriesSets]) => (
        <section key={series}>
          <div className="mb-8 flex items-center gap-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">
              {series}
            </h2>
            <div className="h-px flex-1 bg-zinc-900" />
            <Badge>{seriesSets.length}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-px bg-zinc-900 border border-zinc-900 rounded-xl overflow-hidden sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {seriesSets.map((s) => (
              <Link
                key={s.id}
                href={`/open-pack/${s.id}?mode=${mode}`}
                className="group flex flex-col items-center gap-5 bg-black p-5 transition-all hover:bg-zinc-950 sm:p-8"
              >
                <div className="relative grid h-24 w-full place-items-center bg-zinc-900/30 rounded-xl border border-transparent transition-all group-hover:border-zinc-800 group-hover:bg-zinc-900/50">
                  <CatalogImage
                    src={s.logoUrl}
                    alt={s.name}
                    fill
                    sizes="96px"
                    className="object-contain p-3 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2"
                    fallback={
                      <span className="font-bold text-zinc-700">{s.name}</span>
                    }
                  />
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white group-hover:text-white transition-colors">
                    {s.name}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-2">
                    {s.releaseDate.split("-")[0]} · {s.total} cards
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

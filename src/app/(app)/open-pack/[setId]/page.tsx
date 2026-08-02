import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { sets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateProfile } from "@/lib/game/profile";
import { redirectIfNeedsOnboarding } from "@/lib/game/onboarding";
import { DAILY_PACK_LIMIT } from "@/lib/game/open-pack";
import { PackOpener } from "@/components/pack-opener";

export default async function OpenSetPage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ setId }, { mode: rawMode }] = await Promise.all([params, searchParams]);

  const set = await db.query.sets.findFirst({ where: eq(sets.id, setId) });
  if (!set) notFound();

  const profile = await getOrCreateProfile().catch(() => null);
  const mode = rawMode === "trainer" && profile ? "trainer" : "sandbox";
  if (mode === "trainer") redirectIfNeedsOnboarding(profile);

  let packsRemaining: number | undefined;
  if (mode === "trainer" && profile) {
    const today = new Date().toISOString().slice(0, 10);
    const used = profile.lastPackDate === today ? profile.packsOpenedToday : 0;
    packsRemaining = Math.max(0, DAILY_PACK_LIMIT - used);
  }

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <div className="flex flex-col gap-5 border-b border-zinc-900 pb-6 lg:flex-row lg:items-center lg:justify-between lg:pb-8">
        <div>
          <Link href={`/open-pack?mode=${mode}`} className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
            ← Change booster
          </Link>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <h1 className="text-3xl font-black tracking-tighter text-white">{set.name}</h1>
            <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg ${
              mode === "sandbox" 
                ? "bg-zinc-800 text-zinc-400 border border-zinc-700" 
                : "bg-white text-black border border-white"
            }`}>
              {mode === "sandbox" ? "Sandbox" : "Trainer"}
            </div>
          </div>
        </div>
        <Link 
          href={`/sets/${set.id}`} 
          className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-all flex items-center gap-2"
        >
          Browse cards
          <span className="text-lg opacity-50">→</span>
        </Link>
      </div>

      <div className="relative py-6 sm:py-12">
        <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
        <PackOpener
          set={{ id: set.id, name: set.name, logoUrl: set.logoUrl, symbolUrl: set.symbolUrl }}
          mode={mode}
          initialPacksRemaining={packsRemaining}
        />
      </div>
    </div>
  );
}

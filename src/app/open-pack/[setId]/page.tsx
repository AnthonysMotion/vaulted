import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { sets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateProfile } from "@/lib/game/profile";
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

  let packsRemaining: number | undefined;
  if (mode === "trainer" && profile) {
    const today = new Date().toISOString().slice(0, 10);
    const used = profile.lastPackDate === today ? profile.packsOpenedToday : 0;
    packsRemaining = Math.max(0, DAILY_PACK_LIMIT - used);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/open-pack?mode=${mode}`} className="text-sm text-muted hover:text-foreground">
            ← All sets
          </Link>
          <h1 className="mt-1 text-2xl font-black">{set.name}</h1>
          <p className="text-sm text-muted">
            {set.series} · {set.releaseDate.slice(0, 4)} ·{" "}
            {mode === "sandbox" ? "🏖️ Sandbox (not saved)" : "🏆 Trainer mode"}
          </p>
        </div>
      </div>

      <PackOpener
        set={{ id: set.id, name: set.name, logoUrl: set.logoUrl, symbolUrl: set.symbolUrl }}
        mode={mode}
        initialPacksRemaining={packsRemaining}
      />
    </div>
  );
}

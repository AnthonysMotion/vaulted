import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { cards, sets } from "@/db/schema";
import { simulatePacks } from "@/lib/packs/engine";
import { packConfigForSet } from "@/lib/packs/configs";
import { companionSetIdsFor } from "@/lib/packs/companions";
import { eq, inArray } from "drizzle-orm";

const bodySchema = z.object({
  setId: z.string().min(1),
  packs: z.number().int().min(100).max(500_000),
});

/** Internal testing tool: simulate N packs and report observed rates. */
export async function POST(request: Request) {
  const body = bodySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const set = await db.query.sets.findFirst({ where: eq(sets.id, body.data.setId) });
  if (!set) return NextResponse.json({ error: "Set not found" }, { status: 404 });

  const config = packConfigForSet(set.id, set.series);
  const companionIds = config.companionSetIds ?? companionSetIdsFor(set.id);
  const poolSetIds = [set.id, ...companionIds];

  const setCards = await db.query.cards.findMany({
    where:
      poolSetIds.length === 1
        ? eq(cards.setId, set.id)
        : inArray(cards.setId, poolSetIds),
  });

  const result = simulatePacks(setCards, config, body.data.packs);
  return NextResponse.json({
    set: { id: set.id, name: set.name },
    era: config.era,
    sourceNotes: config.sourceNotes,
    companions: companionIds,
    slots: config.slots.map((s) => ({
      name: s.name,
      count: s.count,
      outcomes: s.outcomes.map((o) => o.label ?? o.rarities.join("|")),
    })),
    result,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { cards, sets, setPullRates } from "@/db/schema";
import { simulatePacks } from "@/lib/packs/engine";
import { packConfigForSet } from "@/lib/packs/configs";
import type { PackConfig } from "@/lib/packs/types";
import { eq } from "drizzle-orm";

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

  const [setCards, pullRates] = await Promise.all([
    db.query.cards.findMany({ where: eq(cards.setId, set.id) }),
    db.query.setPullRates.findFirst({ where: eq(setPullRates.setId, set.id) }),
  ]);

  const config = pullRates
    ? (pullRates.config as PackConfig)
    : packConfigForSet(set.id, set.series);

  const result = simulatePacks(setCards, config, body.data.packs);
  return NextResponse.json({
    set: { id: set.id, name: set.name },
    era: config.era,
    sourceNotes: config.sourceNotes,
    result,
  });
}

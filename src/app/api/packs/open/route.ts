import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateProfile } from "@/lib/game/profile";
import {
  openTrainerPack,
  serialisePackWithCachedPrices,
  PackLimitError,
} from "@/lib/game/open-pack";

const bodySchema = z.object({ setId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const profile = await getOrCreateProfile();
    if (!profile) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const body = bodySchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await openTrainerPack(profile, body.data.setId);
    return NextResponse.json({
      pack: await serialisePackWithCachedPrices(result.pack),
      xpAwarded: result.xpAwarded,
      newLevel: result.newLevel,
      leveledUp: result.leveledUp,
      streak: result.streak,
      packsRemainingToday: result.packsRemainingToday,
      newAchievements: result.newAchievements,
      newCardIds: result.newCardIds,
      completedSet: result.completedSet,
    });
  } catch (err) {
    if (err instanceof PackLimitError) {
      return NextResponse.json(
        { error: "Daily pack limit reached. Come back tomorrow!" },
        { status: 429 },
      );
    }
    console.error("trainer open failed", err);
    return NextResponse.json({ error: "Could not open pack" }, { status: 500 });
  }
}

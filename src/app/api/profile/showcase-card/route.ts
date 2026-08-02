import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { profiles, userCards } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/game/profile";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const bodySchema = z.object({
  cardId: z.string().min(1).nullable(),
});

/** Set or clear the profile showcase card (must own the card). */
export async function PUT(request: Request) {
  const profile = await getOrCreateProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { cardId } = parsed.data;

  if (cardId) {
    const owned = await db.query.userCards.findFirst({
      where: and(
        eq(userCards.userId, profile.id),
        eq(userCards.cardId, cardId),
      ),
      columns: { id: true },
    });
    if (!owned) {
      return NextResponse.json(
        { error: "You can only showcase cards you own" },
        { status: 400 },
      );
    }
  }

  await db
    .update(profiles)
    .set({ favouriteCardId: cardId })
    .where(eq(profiles.id, profile.id));

  revalidatePath(`/profile/${profile.username}`);
  revalidatePath("/account");

  return NextResponse.json({ ok: true, cardId });
}

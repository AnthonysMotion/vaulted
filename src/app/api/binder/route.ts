import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { binders, binderSlots, userCards } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/game/profile";
import { and, eq, inArray } from "drizzle-orm";

const bodySchema = z.object({
  slots: z
    .array(
      z.object({
        position: z.number().int().min(0).max(8),
        cardId: z.string().min(1),
        isFavourite: z.boolean().optional(),
      }),
    )
    .max(9),
});

/** Replace the caller's binder layout. Only owned cards are allowed. */
export async function PUT(request: Request) {
  const profile = await getOrCreateProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const body = bodySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const positions = new Set(body.data.slots.map((s) => s.position));
  if (positions.size !== body.data.slots.length) {
    return NextResponse.json({ error: "Duplicate positions" }, { status: 400 });
  }

  // Rule: users can only showcase cards they actually own.
  const cardIds = [...new Set(body.data.slots.map((s) => s.cardId))];
  if (cardIds.length > 0) {
    const owned = await db.query.userCards.findMany({
      where: and(
        eq(userCards.userId, profile.id),
        inArray(userCards.cardId, cardIds),
      ),
      columns: { cardId: true },
    });
    const ownedIds = new Set(owned.map((o) => o.cardId));
    const notOwned = cardIds.filter((id) => !ownedIds.has(id));
    if (notOwned.length > 0) {
      return NextResponse.json(
        { error: `You don't own: ${notOwned.join(", ")}` },
        { status: 403 },
      );
    }
  }

  let binder = await db.query.binders.findFirst({
    where: eq(binders.userId, profile.id),
  });
  if (!binder) {
    [binder] = await db.insert(binders).values({ userId: profile.id }).returning();
  }

  await db.delete(binderSlots).where(eq(binderSlots.binderId, binder.id));
  if (body.data.slots.length > 0) {
    await db.insert(binderSlots).values(
      body.data.slots.map((s) => ({
        binderId: binder.id,
        position: s.position,
        cardId: s.cardId,
        isFavourite: s.isFavourite ?? false,
      })),
    );
  }
  await db
    .update(binders)
    .set({ updatedAt: new Date() })
    .where(eq(binders.id, binder.id));

  return NextResponse.json({ ok: true });
}

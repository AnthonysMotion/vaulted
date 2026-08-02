import { NextResponse } from "next/server";
import { db } from "@/db";
import { cards, sets, userCards } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/game/profile";
import { and, desc, eq, ilike } from "drizzle-orm";

/** Search the caller's owned cards (binder / showcase picker). */
export async function GET(request: Request) {
  const profile = await getOrCreateProfile();
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  const conditions = [eq(userCards.userId, profile.id)];
  if (q) conditions.push(ilike(cards.name, `%${q}%`));

  const rows = await db
    .select({
      id: cards.id,
      name: cards.name,
      rarity: cards.rarity,
      number: cards.number,
      imageSmall: cards.imageSmall,
      imageLarge: cards.imageLarge,
      setName: sets.name,
      quantity: userCards.quantity,
    })
    .from(userCards)
    .innerJoin(cards, eq(userCards.cardId, cards.id))
    .innerJoin(sets, eq(cards.setId, sets.id))
    .where(and(...conditions))
    .orderBy(desc(userCards.firstObtainedAt))
    .limit(60);

  return NextResponse.json({ cards: rows });
}

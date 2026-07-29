import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { feedReactions } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/game/profile";
import { and, eq } from "drizzle-orm";

const bodySchema = z.object({
  feedItemId: z.number().int(),
  reaction: z.enum(["like", "fire", "lucky", "rip"]),
});

/** Toggle a reaction on a feed item. */
export async function POST(request: Request) {
  const profile = await getOrCreateProfile();
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = bodySchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const existing = await db.query.feedReactions.findFirst({
    where: and(
      eq(feedReactions.feedItemId, body.data.feedItemId),
      eq(feedReactions.userId, profile.id),
      eq(feedReactions.reaction, body.data.reaction),
    ),
  });

  if (existing) {
    await db
      .delete(feedReactions)
      .where(
        and(
          eq(feedReactions.feedItemId, body.data.feedItemId),
          eq(feedReactions.userId, profile.id),
          eq(feedReactions.reaction, body.data.reaction),
        ),
      );
    return NextResponse.json({ ok: true, toggled: "off" });
  }

  await db.insert(feedReactions).values({
    feedItemId: body.data.feedItemId,
    userId: profile.id,
    reaction: body.data.reaction,
  });
  return NextResponse.json({ ok: true, toggled: "on" });
}

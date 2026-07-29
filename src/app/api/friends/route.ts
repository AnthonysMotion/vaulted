import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { friendships, profiles } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/game/profile";
import { and, eq, or } from "drizzle-orm";

const requestSchema = z.object({ username: z.string().min(1) });
const respondSchema = z.object({
  friendshipId: z.number().int(),
  action: z.enum(["accept", "reject"]),
});
const removeSchema = z.object({ friendId: z.string().uuid() });

/** Send a friend request by username. */
export async function POST(request: Request) {
  const profile = await getOrCreateProfile();
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = requestSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const target = await db.query.profiles.findFirst({
    where: eq(profiles.username, body.data.username.toLowerCase()),
  });
  if (!target) return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  if (target.id === profile.id) {
    return NextResponse.json({ error: "You can't befriend yourself" }, { status: 400 });
  }

  const existing = await db.query.friendships.findFirst({
    where: or(
      and(eq(friendships.requesterId, profile.id), eq(friendships.addresseeId, target.id)),
      and(eq(friendships.requesterId, target.id), eq(friendships.addresseeId, profile.id)),
    ),
  });
  if (existing) {
    return NextResponse.json(
      { error: existing.status === "accepted" ? "Already friends" : "Request already pending" },
      { status: 409 },
    );
  }

  await db.insert(friendships).values({
    requesterId: profile.id,
    addresseeId: target.id,
  });
  return NextResponse.json({ ok: true });
}

/** Accept or reject an incoming request. */
export async function PATCH(request: Request) {
  const profile = await getOrCreateProfile();
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = respondSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const friendship = await db.query.friendships.findFirst({
    where: and(
      eq(friendships.id, body.data.friendshipId),
      eq(friendships.addresseeId, profile.id),
      eq(friendships.status, "pending"),
    ),
  });
  if (!friendship) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  if (body.data.action === "accept") {
    await db
      .update(friendships)
      .set({ status: "accepted", respondedAt: new Date() })
      .where(eq(friendships.id, friendship.id));
  } else {
    await db.delete(friendships).where(eq(friendships.id, friendship.id));
  }
  return NextResponse.json({ ok: true });
}

/** Remove a friend (either direction). */
export async function DELETE(request: Request) {
  const profile = await getOrCreateProfile();
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = removeSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await db
    .delete(friendships)
    .where(
      or(
        and(
          eq(friendships.requesterId, profile.id),
          eq(friendships.addresseeId, body.data.friendId),
        ),
        and(
          eq(friendships.requesterId, body.data.friendId),
          eq(friendships.addresseeId, profile.id),
        ),
      ),
    );
  return NextResponse.json({ ok: true });
}

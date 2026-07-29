"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import type { FeedItemWithRelations } from "@/lib/game/queries";
import { EmptyState } from "./ui";

const REACTIONS = [
  { key: "like", emoji: "👍" },
  { key: "fire", emoji: "🔥" },
  { key: "lucky", emoji: "🍀" },
  { key: "rip", emoji: "💀" },
] as const;

function eventText(item: FeedItemWithRelations): { icon: string; text: string } {
  const p = item.payload;
  switch (item.type) {
    case "rare_pull":
      return { icon: "🔥", text: `pulled ${p.cardName} (${p.rarity}) from ${p.setName}!` };
    case "set_completed":
      return { icon: "🎉", text: `completed ${p.setName}!` };
    case "level_up":
      return { icon: "⬆️", text: `reached trainer level ${p.level}!` };
    case "streak_milestone":
      return { icon: "🔥", text: `hit a ${p.streak} day opening streak!` };
    case "achievement":
      return { icon: "🏅", text: `unlocked ${p.achievementName}` };
    case "pack_dud":
      return { icon: "💀", text: `opened ${p.packCount} packs with no ultra rare...` };
  }
}

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function FeedList({
  items,
  viewerId,
  compact = false,
}: {
  items: FeedItemWithRelations[];
  viewerId: string | null;
  compact?: boolean;
}) {
  if (items.length === 0) {
    return (
      <EmptyState icon="📣" title="Nothing here yet">
        Big pulls, completed sets and level-ups will show up here.
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <FeedRow key={item.id} item={item} viewerId={viewerId} compact={compact} />
      ))}
    </div>
  );
}

function FeedRow({
  item,
  viewerId,
  compact,
}: {
  item: FeedItemWithRelations;
  viewerId: string | null;
  compact: boolean;
}) {
  const { icon, text } = eventText(item);

  const initial: Record<string, { count: number; mine: boolean }> = {};
  for (const r of REACTIONS) {
    const list = item.reactions.filter((x) => x.reaction === r.key);
    initial[r.key] = {
      count: list.length,
      mine: viewerId ? list.some((x) => x.userId === viewerId) : false,
    };
  }
  const [reactions, setReactions] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle(reaction: (typeof REACTIONS)[number]["key"]) {
    if (!viewerId || busy) return;
    setBusy(true);
    const prev = reactions[reaction];
    setReactions({
      ...reactions,
      [reaction]: {
        count: prev.count + (prev.mine ? -1 : 1),
        mine: !prev.mine,
      },
    });
    try {
      const res = await fetch("/api/feed/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedItemId: item.id, reaction }),
      });
      if (!res.ok) setReactions(reactions);
    } catch {
      setReactions(reactions);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-3 rounded-xl border border-border bg-surface p-4">
      {item.payload.cardImage && !compact && (
        <img
          src={item.payload.cardImage}
          alt={item.payload.cardName ?? ""}
          className="h-20 rounded shadow-lg"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="mr-1">{icon}</span>
          <Link
            href={`/profile/${item.user.username}`}
            className="font-semibold text-anthracite underline decoration-primary underline-offset-2 hover:text-foreground"
          >
            {item.user.username}
          </Link>{" "}
          {text}
        </p>
        <p className="mt-0.5 text-xs text-muted">{timeAgo(item.createdAt)}</p>
        <div className="mt-2 flex gap-1.5">
          {REACTIONS.map((r) => {
            const state = reactions[r.key];
            return (
              <button
                key={r.key}
                onClick={() => toggle(r.key)}
                disabled={!viewerId}
                className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                  state.mine
                    ? "border-anthracite bg-anthracite text-white"
                    : "border-border bg-surface-2 text-muted hover:text-foreground"
                } ${viewerId ? "cursor-pointer" : "cursor-default"}`}
              >
                {r.emoji} {state.count > 0 && state.count}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

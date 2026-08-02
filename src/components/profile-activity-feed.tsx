/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import type { ProfilePackOpening } from "@/lib/game/queries";
import { rarityBadgeColor, Badge } from "@/components/ui";

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ProfileActivityFeed({
  openings,
  username,
}: {
  openings: ProfilePackOpening[];
  username: string;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          Recent packs
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-700">
          Trainer
        </span>
      </div>

      {openings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-900 px-4 py-8 text-center">
          <p className="text-xs text-zinc-500">
            No packs yet for {username}.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {openings.map((opening) => (
            <PackOpeningRow key={opening.id} opening={opening} />
          ))}
        </div>
      )}
    </section>
  );
}

function PackOpeningRow({ opening }: { opening: ProfilePackOpening }) {
  return (
    <article className="rounded-lg border border-zinc-900 bg-zinc-950/80 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <Link
          href={`/sets/${opening.set.id}`}
          className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md border border-zinc-800 bg-black"
        >
          {opening.set.logoUrl ? (
            <img
              src={opening.set.logoUrl}
              alt=""
              className="max-h-6 max-w-[80%] object-contain"
            />
          ) : (
            <span className="text-[8px] font-bold text-zinc-600">SET</span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/sets/${opening.set.id}`}
              className="truncate text-sm font-medium text-white hover:underline"
            >
              {opening.set.name}
            </Link>
            {opening.isGodPack && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-amber-300">
                God
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {timeAgo(opening.openedAt)}
            <span className="mx-1 text-zinc-700">·</span>
            {opening.cardCount} cards
            <span className="mx-1 text-zinc-700">·</span>+{opening.xpAwarded} XP
          </p>
        </div>

        {opening.highlights.length > 0 && (
          <div className="flex shrink-0 gap-1">
            {opening.highlights.slice(0, 3).map((hit) => (
              <div
                key={`${opening.id}-${hit.cardId}`}
                className="w-8 overflow-hidden rounded border border-zinc-800 bg-black sm:w-9"
                title={hit.card?.name ?? hit.cardId}
              >
                <div className="aspect-[63/88]">
                  {hit.card?.imageSmall ? (
                    <img
                      src={hit.card.imageSmall}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-[7px] text-zinc-600">
                      ?
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {opening.highlights[0] && opening.highlights[0].tier >= 4 && (
        <div className="mt-1.5 flex items-center gap-1.5 pl-11">
          <Badge color={rarityBadgeColor(opening.highlights[0].tier)}>
            {opening.highlights[0].rarity ?? "Hit"}
          </Badge>
          <span className="truncate text-[11px] text-zinc-400">
            {opening.highlights[0].card?.name}
          </span>
        </div>
      )}
    </article>
  );
}

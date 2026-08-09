import Link from "next/link";
import type { ProfilePackOpening } from "@/lib/game/queries";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui";
import { rarityBadgeColor } from "@/lib/packs/rarity";

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
    <div className="min-w-0">
      {openings.length === 0 ? (
        <div className="border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-2">No packs yet for {username}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-px overflow-hidden border border-border bg-border">
          {openings.map((opening) => (
            <PackOpeningRow key={opening.id} opening={opening} />
          ))}
        </div>
      )}
    </div>
  );
}

function PackOpeningRow({ opening }: { opening: ProfilePackOpening }) {
  return (
    <article className="bg-background px-4 py-4 transition-colors hover:bg-surface sm:px-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/sets/${opening.set.id}`}
          className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden border border-border bg-surface"
        >
          {opening.set.logoUrl ? (
            <div className="relative h-6 w-[80%]">
              <SafeImage
                src={opening.set.logoUrl}
                alt=""
                fill
                sizes="40px"
                className="object-contain"
                fallback={
                  <span className="font-mono text-[8px] text-muted-2">SET</span>
                }
              />
            </div>
          ) : (
            <span className="font-mono text-[8px] text-muted-2">SET</span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/sets/${opening.set.id}`}
              className="truncate text-sm font-medium tracking-[-0.02em] text-white transition-colors hover:text-accent"
            >
              {opening.set.name}
            </Link>
            {opening.isGodPack && (
              <span className="border border-amber-500/40 bg-amber-500/10 px-1.5 py-px font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-amber-300">
                God
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted">
            {timeAgo(opening.openedAt)}
            <span className="mx-1.5 text-border">/</span>
            {opening.cardCount} cards
            <span className="mx-1.5 text-border">/</span>+{opening.xpAwarded} XP
          </p>
        </div>

        {opening.highlights.length > 0 && (
          <div className="flex shrink-0 gap-1">
            {opening.highlights.slice(0, 3).map((hit) => (
              <div
                key={`${opening.id}-${hit.cardId}`}
                className="w-8 overflow-hidden border border-border bg-black sm:w-9"
                title={hit.card?.name ?? hit.cardId}
              >
                <div className="relative aspect-[63/88]">
                  <SafeImage
                    src={hit.card?.imageSmall}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                    fallback={
                      <div className="grid h-full place-items-center text-[7px] text-muted-2">
                        ?
                      </div>
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {opening.highlights[0] && opening.highlights[0].tier >= 4 && (
        <div className="mt-2 flex items-center gap-2 pl-[3.25rem]">
          <Badge color={rarityBadgeColor(opening.highlights[0].tier)}>
            {opening.highlights[0].rarity ?? "Hit"}
          </Badge>
          <span className="truncate text-xs text-muted">
            {opening.highlights[0].card?.name}
          </span>
        </div>
      )}
    </article>
  );
}

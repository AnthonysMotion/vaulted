"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CARD_IMAGE } from "@/lib/images";
import { CatalogImage } from "@/components/catalog-image";
import { Card } from "@/components/ui";

export type CompareMissingCard = {
  id: string;
  name: string;
  rarity: string | null;
  number: string;
  imageSmall: string | null;
};

const ROW_H = 40;

export function CompareMissingList({
  title,
  cards,
  highlightIds,
  highlightLabel,
}: {
  title: string;
  cards: CompareMissingCard[];
  highlightIds?: string[];
  highlightLabel?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const highlight = highlightIds?.length ? new Set(highlightIds) : null;

  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 12,
    enabled: cards.length > 0,
  });

  return (
    <Card>
      <h2 className="font-bold">{title}</h2>
      {cards.length === 0 ? (
        <p className="mt-3 text-sm text-emerald-400">Set complete! 🏆</p>
      ) : (
        <div ref={parentRef} className="mt-3 max-h-96 overflow-y-auto pr-2">
          <ul
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((row) => {
              const c = cards[row.index];
              return (
                <li
                  key={c.id}
                  className="absolute top-0 left-0 flex w-full items-center gap-2 text-sm"
                  style={{
                    height: ROW_H,
                    transform: `translateY(${row.start}px)`,
                  }}
                >
                  {c.imageSmall && (
                    <CatalogImage
                      src={c.imageSmall}
                      alt=""
                      width={CARD_IMAGE.thumb.width}
                      height={CARD_IMAGE.thumb.height}
                      sizes="32px"
                      className="h-8 w-auto"
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {c.name} <span className="text-xs text-muted">#{c.number}</span>
                  </span>
                  <span className="text-xs text-muted">{c.rarity}</span>
                  {highlight?.has(c.id) && (
                    <span className="bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                      {highlightLabel}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}

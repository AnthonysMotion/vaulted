"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { CardGallery } from "./card-gallery";
import { CardTile, type CardTileData } from "./card-tile";

type GalleryCard = CardTileData & { number: string };

const GAP_X = 20;
const GAP_Y = 32;
const META_H = 52;

function columnsForWidth(width: number) {
  if (width >= 1280) return 5;
  if (width >= 768) return 4;
  if (width >= 640) return 3;
  return 2;
}

function estimateRowHeight(containerWidth: number, columns: number) {
  const cardWidth = Math.max(
    80,
    (containerWidth - GAP_X * (columns - 1)) / columns,
  );
  return cardWidth * (88 / 63) + META_H + GAP_Y;
}

function GalleryCell({ card }: { card: GalleryCard }) {
  return (
    <button
      type="button"
      data-card-id={card.id}
      className="group flex cursor-pointer flex-col gap-3 text-left"
    >
      <div className="relative aspect-[63/88] w-full transition-transform duration-300 group-hover:-translate-y-1">
        <CardTile card={card} size="lg" />
      </div>
      <div className="px-1">
        <div className="mb-1 truncate text-xs font-bold text-white">{card.name}</div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-700">
            #{card.number}
          </div>
          {card.rarity && (
            <div className="text-[9px] font-bold uppercase text-muted-2">
              {card.rarity.split(" ").pop()}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function SetCardGallery({
  cards,
  initialCardId = null,
}: {
  cards: GalleryCard[];
  initialCardId?: string | null;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const update = () => {
      setWidth(el.clientWidth);
      setScrollMargin(el.offsetTop);
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columns = columnsForWidth(width || 640);
  const rowCount = Math.ceil(cards.length / columns);
  const estimatedSize = estimateRowHeight(width || 640, columns);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimatedSize,
    overscan: 3,
    scrollMargin,
  });

  return (
    <CardGallery cards={cards} initialCardId={initialCardId}>
      <div ref={listRef}>
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((row) => {
            const start = row.index * columns;
            const rowCards = cards.slice(start, start + columns);
            return (
              <div
                key={row.key}
                data-index={row.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${row.start - scrollMargin}px)`,
                  paddingBottom: row.index < rowCount - 1 ? GAP_Y : 0,
                }}
              >
                <div
                  className="grid gap-x-5"
                  style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                >
                  {rowCards.map((card) => (
                    <GalleryCell key={card.id} card={card} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CardGallery>
  );
}

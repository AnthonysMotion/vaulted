"use client";

import { useState } from "react";
import { CardLightbox } from "./card-lightbox";
import { CardTile, type CardTileData } from "./card-tile";

type CollectionGalleryCard = CardTileData & {
  setCode: string;
  number: string;
};

export function CollectionCardGallery({
  cards,
}: {
  cards: CollectionGalleryCard[];
}) {
  const [lightboxCard, setLightboxCard] = useState<CardTileData | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.id} className="group flex flex-col gap-3">
            <div className="relative aspect-[63/88] w-full transition-transform duration-300 group-hover:-translate-y-1">
              <CardTile card={card} size="lg" onClick={() => setLightboxCard(card)} />
            </div>
            <div className="px-1">
              <div className="truncate text-xs font-bold text-white mb-1">{card.name}</div>
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                  {card.setCode} · #{card.number}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CardLightbox card={lightboxCard} onClose={() => setLightboxCard(null)} />
    </>
  );
}

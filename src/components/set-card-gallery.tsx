"use client";

import { useState } from "react";
import { CardTile, type CardTileData } from "./card-tile";
import { CardLightbox } from "./card-lightbox";

type GalleryCard = CardTileData & { number: string };

export function SetCardGallery({ cards }: { cards: GalleryCard[] }) {
  const [lightboxCard, setLightboxCard] = useState<CardTileData | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
        {cards.map((card) => (
          <div key={card.id} className="group flex flex-col gap-2">
            <div className="transition-transform duration-300 group-hover:-translate-y-1">
              <CardTile
                card={card}
                size="fill"
                onClick={() => setLightboxCard(card)}
              />
            </div>
            <div className="px-0.5">
              <div className="truncate text-[10px] font-bold text-white mb-0.5">{card.name}</div>
              <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                #{card.number}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CardLightbox card={lightboxCard} onClose={() => setLightboxCard(null)} />
    </>
  );
}

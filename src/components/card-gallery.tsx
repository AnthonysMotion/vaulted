"use client";

import { useState, type ReactNode } from "react";
import { CardLightbox } from "./card-lightbox";
import type { CardTileData } from "./card-tile";

export function CardGallery({
  cards,
  children,
}: {
  cards: CardTileData[];
  children: ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openCard = openId ? (cards.find((c) => c.id === openId) ?? null) : null;

  return (
    <div
      onClick={(event) => {
        const el = (event.target as HTMLElement).closest<HTMLElement>("[data-card-id]");
        if (!el?.dataset.cardId) return;
        setOpenId(el.dataset.cardId);
      }}
    >
      {children}
      <CardLightbox card={openCard} onClose={() => setOpenId(null)} />
    </div>
  );
}

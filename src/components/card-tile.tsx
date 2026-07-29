"use client";

/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";

export type CardTileData = {
  id: string;
  name: string;
  rarity: string | null;
  imageSmall: string | null;
  imageLarge?: string | null;
  reverseHolo?: boolean;
  rarityTier: number;
  quantity?: number;
};

export function CardTile({
  card,
  size = "md",
  onClick,
}: {
  card: CardTileData;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}) {
  const glow = card.rarityTier >= 3 ? `glow-tier-${Math.min(card.rarityTier, 6)}` : "";
  const shimmer = card.reverseHolo || card.rarityTier >= 3 ? "holo-shimmer" : "";
  const sizes = { sm: "w-24", md: "w-36", lg: "w-56" };

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 0.5 }}
      className={`relative ${sizes[size]} shrink-0 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className={`relative aspect-[63/88] overflow-hidden rounded-lg ${glow} ${shimmer}`}>
        {card.imageSmall ? (
          <img
            src={card.imageSmall}
            alt={card.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-surface-2 p-2 text-center text-xs text-muted">
            {card.name}
          </div>
        )}
      </div>
      {card.quantity !== undefined && card.quantity > 1 && (
        <span className="absolute -right-1.5 -top-1.5 grid min-w-6 place-items-center rounded-full border border-border bg-surface px-1 text-xs font-bold text-primary shadow">
          ×{card.quantity}
        </span>
      )}
      {card.reverseHolo && (
        <span className="absolute bottom-1 left-1 rounded bg-sky-500/80 px-1 py-px text-[9px] font-bold uppercase text-white">
          Reverse
        </span>
      )}
    </motion.div>
  );
}

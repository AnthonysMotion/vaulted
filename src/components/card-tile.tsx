"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import type { PointerEvent as ReactPointerEvent } from "react";
import { SafeImage } from "@/components/safe-image";

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
  const sizes = { sm: "w-24", md: "w-36", lg: "w-56" };
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 180, damping: 18, mass: 0.75 });
  const springY = useSpring(rotateY, { stiffness: 180, damping: 18, mass: 0.75 });
  const glareX = useTransform(springY, [-10, 10], ["30%", "70%"]);
  const glareY = useTransform(springX, [-10, 10], ["65%", "35%"]);
  const glarePosition = useMotionTemplate`${glareX} ${glareY}`;

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / Math.max(rect.width / 2, 1);
    const dy = (e.clientY - cy) / Math.max(rect.height / 2, 1);
    rotateY.set(dx * 10);
    rotateX.set(-dy * 8);
  };

  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative ${sizes[size]} shrink-0 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
      style={{
        rotateX: springX,
        rotateY: springY,
        transformPerspective: 900,
        willChange: "transform",
      }}
    >
      <div className={`relative aspect-[63/88] overflow-hidden rounded-lg ${glow}`}>
        <SafeImage
          src={card.imageSmall}
          alt={card.name}
          fill
          sizes={
            size === "lg"
              ? "(max-width: 640px) 45vw, 224px"
              : size === "sm"
                ? "96px"
                : "(max-width: 640px) 30vw, 144px"
          }
          className="object-cover"
          fallback={
            <div className="grid h-full w-full place-items-center bg-surface-2 p-2 text-center text-xs text-muted">
              {card.name}
            </div>
          }
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[3] opacity-70 mix-blend-screen"
          style={{
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 22%, rgba(255,255,255,0) 48%)",
            backgroundPosition: glarePosition,
          }}
        />
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

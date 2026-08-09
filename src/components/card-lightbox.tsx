"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { SafeImage } from "@/components/safe-image";
import { hiresCardImageUrl } from "@/lib/images";
import type { CardTileData } from "./card-tile";

export function CardLightbox({
  card,
  onClose,
}: {
  card: CardTileData | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 180, damping: 18, mass: 0.8 });
  const springY = useSpring(rotateY, { stiffness: 180, damping: 18, mass: 0.8 });
  const glareX = useTransform(springY, [-12, 12], ["30%", "70%"]);
  const glareY = useTransform(springX, [-12, 12], ["65%", "35%"]);
  const glarePosition = useMotionTemplate`${glareX} ${glareY}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!card) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleMouseMove = (e: MouseEvent) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / Math.max(window.innerWidth / 2, 1);
      const dy = (e.clientY - cy) / Math.max(window.innerHeight / 2, 1);
      rotateY.set(dx * 12);
      rotateX.set(-dy * 10);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", onKey);
      rotateX.set(0);
      rotateY.set(0);
    };
  }, [card, onClose, rotateX, rotateY]);

  const glow = card && card.rarityTier >= 3 ? `glow-tier-${Math.min(card.rarityTier, 6)}` : "";

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {card && (
        <motion.div
          key="lightbox-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="lightbox-card"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.35, duration: 0.45 }}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-5 select-none"
          >
            <motion.div
              ref={cardRef}
              style={{
                rotateX: springX,
                rotateY: springY,
                transformPerspective: 1200,
                willChange: "transform",
              }}
              className={`relative w-[min(80vw,20rem)] sm:w-80 aspect-[63/88] overflow-hidden shadow-2xl ${glow}`}
            >
              <SafeImage
                src={
                  card.imageLarge ??
                  hiresCardImageUrl(card.imageSmall) ??
                  card.imageSmall
                }
                alt={card.name}
                fill
                sizes="(max-width: 640px) 80vw, 320px"
                quality={90}
                preload
                draggable={false}
                className="object-cover"
                fallback={
                  <div className="grid h-full w-full place-items-center bg-surface-2 text-center text-white">
                    {card.name}
                  </div>
                }
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[3] opacity-80 mix-blend-screen"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.12) 18%, rgba(255,255,255,0) 45%)",
                  backgroundPosition: glarePosition,
                }}
              />
            </motion.div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-base font-bold text-white">{card.name}</p>
              {card.rarity && (
                <p className="text-xs font-bold uppercase tracking-widest text-muted-2">
                  {card.rarity}
                </p>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-700">
              Click anywhere or press Esc to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

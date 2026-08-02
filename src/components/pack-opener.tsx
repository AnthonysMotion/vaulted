"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SerialisedPack, SerialisedPulledCard } from "@/lib/game/open-pack";
import { Badge, Button, rarityBadgeColor } from "./ui";
import { CardTile } from "./card-tile";
import { CardLightbox } from "./card-lightbox";

/**
 * Sound effect placeholder. Wire real audio here later:
 * pack-rip, card-flip, rare-sting, god-pack-fanfare.
 */
function playSound(name: "rip" | "flip" | "rare" | "god") {
  void name;
}

type Phase = "idle" | "shaking" | "ripping" | "revealing" | "summary";

export type TrainerMeta = {
  xpAwarded: number;
  newLevel: number;
  leveledUp: boolean;
  streak: number;
  packsRemainingToday: number;
  newAchievements: { id: string; name: string; icon: string }[];
  newCardIds: string[];
  completedSet: boolean;
};

type SetInfo = {
  id: string;
  name: string;
  logoUrl: string | null;
  symbolUrl: string | null;
};

export function PackOpener({
  set,
  mode,
  initialPacksRemaining,
}: {
  set: SetInfo;
  mode: "sandbox" | "trainer";
  initialPacksRemaining?: number;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [pack, setPack] = useState<SerialisedPack | null>(null);
  const [meta, setMeta] = useState<TrainerMeta | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SerialisedPack[]>([]);
  const [packsRemaining, setPacksRemaining] = useState(initialPacksRemaining ?? Infinity);
  const [lightboxCard, setLightboxCard] = useState<SerialisedPulledCard | null>(null);

  const bestTier = useMemo(
    () => (pack ? Math.max(...pack.cards.map((c) => c.rarityTier)) : 0),
    [pack],
  );

  const openPack = useCallback(async () => {
    setError(null);
    setPhase("shaking");
    playSound("rip");

    const endpoint = mode === "sandbox" ? "/api/packs/sandbox" : "/api/packs/open";
    try {
      const [res] = await Promise.all([
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setId: set.id }),
        }),
        // Let the shake build suspense even on fast responses.
        new Promise((resolve) => setTimeout(resolve, 1400)),
      ]);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setPhase("idle");
        return;
      }
      setPack(data.pack);
      if (mode === "trainer") {
        setMeta(data as TrainerMeta);
        setPacksRemaining(data.packsRemainingToday);
      }
      if (data.pack.isGodPack) playSound("god");
      setRevealIndex(0);
      setPhase("ripping");
      setTimeout(() => setPhase("revealing"), 900);
    } catch {
      setError("Network error — try again");
      setPhase("idle");
    }
  }, [mode, set.id]);

  const revealNext = useCallback(() => {
    if (!pack) return;
    playSound(pack.cards[revealIndex]?.rarityTier >= 4 ? "rare" : "flip");
    if (revealIndex + 1 >= pack.cards.length) {
      setHistory((h) => [pack, ...h].slice(0, 20));
      setPhase("summary");
    } else {
      setRevealIndex((i) => i + 1);
    }
  }, [pack, revealIndex]);

  const reset = useCallback(() => {
    setPack(null);
    setMeta(null);
    setPhase("idle");
    setLightboxCard(null);
  }, []);

  const canOpen = mode === "sandbox" || packsRemaining > 0;

  return (
    <div className="flex flex-col items-center gap-6">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ------------------------------------------------ pack on table */}
        {(phase === "idle" || phase === "shaking" || phase === "ripping") && (
          <motion.div
            key="pack"
            className="flex flex-col items-center gap-8 py-8"
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.3 }}
          >
            <BoosterPackArt
              set={set}
              shaking={phase === "shaking"}
              ripping={phase === "ripping"}
              interactive={phase === "idle" && canOpen}
              onClick={phase === "idle" && canOpen ? openPack : undefined}
            />
            {phase === "idle" && (
              <div className="flex flex-col items-center gap-3">
                <Button onClick={openPack} disabled={!canOpen} className="px-8 py-3 text-base">
                  {canOpen ? "Open Pack" : "No packs left today"}
                </Button>
                {mode === "trainer" && Number.isFinite(packsRemaining) && (
                  <p className="text-sm text-muted">
                    {packsRemaining} pack{packsRemaining === 1 ? "" : "s"} remaining today
                  </p>
                )}
              </div>
            )}
            {phase === "shaking" && (
              <p className="animate-pulse text-sm text-muted">Shuffling fate...</p>
            )}
          </motion.div>
        )}

        {/* ------------------------------------------------ card reveals */}
        {phase === "revealing" && pack && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-4"
          >
            {pack.isGodPack && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-full border border-yellow-400/50 bg-yellow-400/10 px-6 py-2 text-lg font-black text-yellow-300"
              >
                ✨ GOD PACK ✨
              </motion.div>
            )}
            <div className="text-sm text-muted">
              Card {revealIndex + 1} of {pack.cards.length}
            </div>

            <RevealStack
              cards={pack.cards}
              revealIndex={revealIndex}
              onReveal={revealNext}
            />

            <p className="text-xs text-muted">Tap the card to reveal the next one</p>
          </motion.div>
        )}

        {/* ------------------------------------------------ summary */}
        {phase === "summary" && pack && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full flex-col items-center gap-6"
          >
            <h2 className="text-2xl font-bold">
              {bestTier >= 6
                ? "🌈 INSANE PULLS!"
                : bestTier >= 5
                  ? "🔥 Great pack!"
                  : bestTier >= 4
                    ? "✨ Nice hit!"
                    : "Pack opened"}
            </h2>

            {meta && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge color="gold">+{meta.xpAwarded} XP</Badge>
                <Badge color="blue">🔥 {meta.streak} day streak</Badge>
                {meta.leveledUp && <Badge color="green">⬆️ Level {meta.newLevel}!</Badge>}
                {meta.completedSet && <Badge color="pink">🏆 Set completed!</Badge>}
                {meta.newAchievements.map((a) => (
                  <Badge key={a.id} color="purple">
                    {a.icon} {a.name}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              {pack.cards.map((card, i) => (
                <motion.div
                  key={`${card.id}-${i}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="relative"
                >
                  <CardTile card={card} size="sm" onClick={() => setLightboxCard(card)} />
                  {meta?.newCardIds.includes(card.id) && (
                    <span className="absolute -left-1 -top-1 rounded bg-emerald-500 px-1 text-[9px] font-bold text-white">
                      NEW
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={reset} disabled={!canOpen}>
                {canOpen ? "Open another" : "Come back tomorrow"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------ session history */}
      {history.length > 0 && phase !== "revealing" && (
        <div className="mt-8 w-full">
          <h3 className="mwg-label mb-3 text-muted">
            Session history · {history.length} pack{history.length === 1 ? "" : "s"}
          </h3>
          <div className="flex flex-col gap-3">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-2 overflow-x-auto rounded-[20px] border border-border bg-surface p-3"
              >
                {h.cards.map((c, j) => (
                  <button
                    key={`${c.id}-${j}`}
                    type="button"
                    onClick={() => setLightboxCard(c)}
                    className={`shrink-0 overflow-hidden rounded transition-transform hover:-translate-y-0.5 ${
                      c.rarityTier >= 4 ? "ring-2 ring-primary" : ""
                    }`}
                    title={`${c.name} · ${c.rarity ?? "?"}`}
                    aria-label={`View ${c.name}`}
                  >
                    <img
                      src={c.imageSmall ?? ""}
                      alt={c.name}
                      className="h-16 rounded"
                    />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <CardLightbox card={lightboxCard} onClose={() => setLightboxCard(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function BoosterPackArt({
  set,
  shaking,
  ripping,
  interactive = false,
  onClick,
}: {
  set: SetInfo;
  shaking: boolean;
  ripping: boolean;
  interactive?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.div
      animate={
        ripping
          ? { rotateZ: [0, -3, 3, 0], scale: [1, 1.06, 1.12], opacity: [1, 1, 0] }
          : shaking
            ? { x: [0, -6, 6, -8, 8, -10, 10, -6, 0], rotateZ: [0, -2, 2, -3, 3, -2, 0] }
            : { y: [0, -8, 0] }
      }
      transition={
        ripping
          ? { duration: 0.9, ease: "easeIn" }
          : shaking
            ? { duration: 0.7, repeat: Infinity }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }
      className={`relative h-80 w-56 select-none ${interactive ? "cursor-pointer" : ""}`}
      onClick={onClick}
      style={{ perspective: 800 }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[20px] border border-border bg-anthracite shadow-[0_24px_60px_rgba(10,10,11,0.25)]">
        {/* crimp */}
        <div className="absolute inset-x-0 top-0 h-6 rounded-t-[20px] bg-gradient-to-b from-white/15 to-transparent [mask-image:repeating-linear-gradient(90deg,black_0_6px,transparent_6px_9px)]" />
        <div className="absolute inset-x-0 bottom-0 h-6 rounded-b-[20px] bg-gradient-to-t from-white/15 to-transparent [mask-image:repeating-linear-gradient(90deg,black_0_6px,transparent_6px_9px)]" />
        <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
          {set.logoUrl ? (
            <img src={set.logoUrl} alt={set.name} className="max-h-24 w-full object-contain brightness-110" />
          ) : (
            <div className="text-center text-lg font-bold text-white">{set.name}</div>
          )}
          <div className="grid h-20 w-20 place-items-center rounded-full bg-primary shadow-[0_0_30px_rgba(201,254,110,0.35)]">
            <div className="h-6 w-6 rounded-full border-4 border-ink bg-white" />
          </div>
          {set.symbolUrl && (
            <img src={set.symbolUrl} alt="" className="h-6 opacity-80 brightness-200" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function RevealStack({
  cards,
  revealIndex,
  onReveal,
}: {
  cards: SerialisedPulledCard[];
  revealIndex: number;
  onReveal: () => void;
}) {
  const card = cards[revealIndex];
  const isBig = card.rarityTier >= 4;

  return (
    <div
      className="relative h-[22rem] w-64 cursor-pointer sm:h-[26rem] sm:w-72"
      onClick={onReveal}
      style={{ perspective: 1200 }}
    >
      {/* face-down stack behind */}
      {cards.length - revealIndex > 1 && (
        <>
          <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-[20px] border border-border bg-surface-2" />
          <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-[20px] border border-border bg-surface" />
        </>
      )}

      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${card.id}-${revealIndex}`}
          initial={{ rotateY: 180, scale: isBig ? 0.7 : 0.95, opacity: 0.6 }}
          animate={{
            rotateY: 0,
            scale: 1,
            opacity: 1,
            transition: {
              duration: isBig ? 0.9 : 0.45,
              type: "spring",
              bounce: isBig ? 0.45 : 0.2,
            },
          }}
          exit={{ x: -260, rotateZ: -12, opacity: 0, transition: { duration: 0.25 } }}
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className={`relative h-full w-full overflow-hidden rounded-xl ${
              card.rarityTier >= 3 ? `glow-tier-${Math.min(card.rarityTier, 6)}` : ""
            }`}
          >
            {card.imageLarge || card.imageSmall ? (
              <img
                src={card.imageLarge ?? card.imageSmall ?? ""}
                alt={card.name}
                className="h-full w-full object-contain"
                draggable={false}
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-surface-2 text-center">
                {card.name}
              </div>
            )}
          </div>

          {isBig && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.5 } }}
              className="absolute -bottom-9 left-1/2 -translate-x-1/2"
            >
              <Badge color={rarityBadgeColor(card.rarityTier)}>
                {card.rarity ?? card.slotName}
              </Badge>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SerialisedPack, SerialisedPulledCard } from "@/lib/game/open-pack";
import { CARD_IMAGE, preloadCardArt } from "@/lib/images";
import { formatMarketPrice } from "@/lib/game/card-price";
import { SafeImage } from "@/components/safe-image";
import { Badge, Button, rarityBadgeColor } from "./ui";
import { CardTile } from "./card-tile";
import { CardLightbox } from "./card-lightbox";
import { VisionLogo } from "@/components/vision-logo";
import { cardCornerRadiusForSet } from "@/lib/cards/corners";

function packArtUrls(pack: SerialisedPack): string[] {
  const urls: string[] = [];
  for (const card of pack.cards) {
    if (card.imageLarge) urls.push(card.imageLarge);
    if (card.imageSmall) urls.push(card.imageSmall);
  }
  return urls;
}

type PriceRow = { market: number | null; reverseMarket: number | null };

function applyPackPrices(
  pack: SerialisedPack,
  prices: Record<string, PriceRow>,
): SerialisedPack {
  return {
    ...pack,
    cards: pack.cards.map((card) => {
      const row = prices[card.id];
      if (!row) return card;
      return {
        ...card,
        marketPrice: card.reverseHolo ? row.reverseMarket : row.market,
      };
    }),
  };
}

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
  series: string;
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
  const [skipping, setSkipping] = useState(false);
  const packGen = useRef(0);

  const bestTier = useMemo(
    () => (pack ? Math.max(...pack.cards.map((c) => c.rarityTier)) : 0),
    [pack],
  );
  const revealPrice = formatMarketPrice(
    phase === "revealing" && pack ? pack.cards[revealIndex]?.marketPrice : null,
  );

  const cardCornerRadius = useMemo(
    () => cardCornerRadiusForSet(set.id, set.series),
    [set.id, set.series],
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
      const nextPack = data.pack as SerialisedPack;
      const gen = ++packGen.current;
      setPack(nextPack);
      void (async () => {
        try {
          const priceRes = await fetch("/api/cards/prices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids: [...new Set(nextPack.cards.map((card) => card.id))],
            }),
            cache: "no-store",
          });
          if (!priceRes.ok || packGen.current !== gen) return;
          const priceData = (await priceRes.json()) as {
            prices?: Record<string, PriceRow>;
          };
          if (!priceData.prices || packGen.current !== gen) return;
          setPack((current) =>
            current ? applyPackPrices(current, priceData.prices!) : current,
          );
        } catch {
          // Keep cached prices if the refresh fails.
        }
      })();
      if (mode === "trainer") {
        setMeta(data as TrainerMeta);
        setPacksRemaining(data.packsRemainingToday);
      }
      if (nextPack.isGodPack) playSound("god");
      setRevealIndex(0);
      setPhase("ripping");

      // Warm art during the rip so the first flip isn't a blank card.
      await Promise.all([
        preloadCardArt(packArtUrls(nextPack)),
        new Promise((resolve) => setTimeout(resolve, 900)),
      ]);
      setPhase("revealing");
    } catch {
      setError("Network error. Try again");
      setPhase("idle");
    }
  }, [mode, set.id]);

  const revealNext = useCallback(() => {
    if (!pack || phase !== "revealing") return;
    const card = pack.cards[revealIndex];
    playSound(card && card.rarityTier >= 4 ? "rare" : "flip");
    if (revealIndex + 1 >= pack.cards.length) {
      setHistory((h) => [pack, ...h].slice(0, 20));
      setPhase("summary");
    } else {
      setRevealIndex((i) => i + 1);
    }
  }, [pack, phase, revealIndex]);

  const finishToSummary = useCallback(
    (opened: SerialisedPack) => {
      setHistory((h) => [opened, ...h].slice(0, 20));
      setPhase("summary");
      setSkipping(false);
    },
    [],
  );

  /**
   * Jump ahead, but still surface unrevealed rare+ pulls with a short sting
   * so god packs / chase hits aren't silently skipped.
   */
  const skipToSummary = useCallback(async () => {
    if (!pack || phase !== "revealing" || skipping) return;

    const remaining = pack.cards.slice(revealIndex + 1);
    if (remaining.length === 0) {
      finishToSummary(pack);
      return;
    }

    setSkipping(true);
    try {
      for (let i = 0; i < remaining.length; i++) {
        const index = revealIndex + 1 + i;
        const card = pack.cards[index];
        if (card.rarityTier < 4) continue;
        setRevealIndex(index);
        playSound("rare");
        await new Promise((r) =>
          setTimeout(r, card.rarityTier >= 5 ? 850 : 650),
        );
      }
      setRevealIndex(pack.cards.length - 1);
      finishToSummary(pack);
    } catch {
      setSkipping(false);
    }
  }, [pack, phase, revealIndex, skipping, finishToSummary]);

  const reset = useCallback(() => {
    setPack(null);
    setMeta(null);
    setPhase("idle");
    setLightboxCard(null);
    setSkipping(false);
  }, []);

  const canOpen = mode === "sandbox" || packsRemaining > 0;

  // Space / Enter: open, reveal next, or open another. Never while typing or in lightbox.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      if (e.repeat) return;
      if (lightboxCard) return;
      if (skipping) return;

      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (phase === "revealing") {
        // Let focused buttons (e.g. Skip) handle Enter themselves.
        if (e.key === "Enter" && target?.closest("button")) return;
        e.preventDefault();
        revealNext();
        return;
      }

      // Idle / summary: don't steal Space/Enter from focused controls.
      if (target?.closest("button, a, [role='button']")) return;

      e.preventDefault();

      if (phase === "idle" && canOpen) {
        void openPack();
        return;
      }
      if (phase === "summary" && canOpen) {
        reset();
        queueMicrotask(() => {
          void openPack();
        });
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    phase,
    canOpen,
    openPack,
    revealNext,
    reset,
    lightboxCard,
    skipping,
  ]);

  return (
    <div className="flex flex-col items-center gap-6">
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex min-h-[40rem] w-full flex-col items-center justify-center sm:min-h-[44rem]">
        <AnimatePresence mode="wait">
          {/* ------------------------------------------------ pack on table */}
          {(phase === "idle" || phase === "shaking" || phase === "ripping") && (
            <motion.div
              key="pack"
              className="flex w-full flex-col items-center gap-6"
              exit={{ opacity: 0, scale: 1.15 }}
              transition={{ duration: 0.3 }}
            >
              <StageHeader />
              <div className="relative pb-10">
                <BoosterPackArt
                  set={set}
                  shaking={phase === "shaking"}
                  ripping={phase === "ripping"}
                  interactive={phase === "idle" && canOpen}
                  onClick={phase === "idle" && canOpen ? openPack : undefined}
                />
              </div>
              <StageControls>
                {phase === "idle" && (
                  <>
                    <Button onClick={openPack} disabled={!canOpen} className="px-8 py-3 text-base">
                      {canOpen ? "Open Pack" : "No packs left today"}
                    </Button>
                    {canOpen ? (
                      <p className="text-xs text-muted">Press Space / Enter to open</p>
                    ) : null}
                    {mode === "trainer" && Number.isFinite(packsRemaining) && (
                      <p className="text-sm text-muted">
                        {packsRemaining} pack{packsRemaining === 1 ? "" : "s"} remaining today
                      </p>
                    )}
                  </>
                )}
                {phase === "shaking" && (
                  <p className="animate-pulse text-sm text-muted">Shuffling fate...</p>
                )}
              </StageControls>
            </motion.div>
          )}

          {/* ------------------------------------------------ card reveals */}
          {phase === "revealing" && pack && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full flex-col items-center gap-6"
            >
              <StageHeader>
                {pack.isGodPack && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="border border-yellow-400/50 bg-yellow-400/10 px-6 py-2 text-lg font-black text-yellow-300"
                  >
                    ✨ GOD PACK ✨
                  </motion.div>
                )}
                <div className="text-sm text-muted">
                  Card {revealIndex + 1} of {pack.cards.length}
                </div>
              </StageHeader>

              <div className="relative pb-10">
                <RevealStack
                  cards={pack.cards}
                  revealIndex={revealIndex}
                  onReveal={skipping ? undefined : revealNext}
                  cornerRadius={cardCornerRadius}
                />
              </div>

              <StageControls>
                {revealPrice && (
                  <p className="font-mono text-sm tabular-nums text-white">
                    {revealPrice}
                  </p>
                )}
                <p className="text-xs text-muted">
                  {skipping
                    ? "Finishing rare pulls…"
                    : "Tap the card or press Space / Enter"}
                </p>
                {!skipping && revealIndex + 1 < pack.cards.length ? (
                  <Button
                    variant="ghost"
                    onClick={() => void skipToSummary()}
                    className="text-xs uppercase tracking-widest text-muted hover:text-white"
                  >
                    Skip to summary
                  </Button>
                ) : null}
              </StageControls>
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
                {pack.cards.map((card, i) => {
                  const price = formatMarketPrice(card.marketPrice);
                  return (
                    <motion.div
                      key={`${card.id}-${i}`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="relative flex flex-col items-center gap-1"
                    >
                      <CardTile card={card} size="sm" onClick={() => setLightboxCard(card)} />
                      {price && (
                        <span className="font-mono text-[10px] tabular-nums text-muted">
                          {price}
                        </span>
                      )}
                      {meta?.newCardIds.includes(card.id) && (
                        <span className="absolute -left-1 -top-1 bg-emerald-500 px-1 text-[9px] font-bold text-white">
                          NEW
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button onClick={reset} disabled={!canOpen}>
                  {canOpen ? "Open another" : "Come back tomorrow"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ------------------------------------------------ session history */}
      {history.length > 0 && (
        <div className="mt-8 w-full">
          <h3 className="mwg-label mb-3 text-muted">
            Session history · {history.length} pack{history.length === 1 ? "" : "s"}
          </h3>
          <div className="flex flex-col gap-3">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-2 overflow-x-auto border border-border bg-surface p-3"
              >
                {h.cards.map((c, j) => (
                  <button
                    key={`${c.id}-${j}`}
                    type="button"
                    onClick={() => setLightboxCard(c)}
                    className={`shrink-0 overflow-hidden transition-transform hover:-translate-y-0.5 ${
                      c.rarityTier >= 4 ? "ring-2 ring-primary" : ""
                    }`}
                    title={`${c.name} · ${c.rarity ?? "?"}`}
                    aria-label={`View ${c.name}`}
                  >
                    <SafeImage
                      src={c.imageSmall}
                      alt={c.name}
                      width={CARD_IMAGE.thumb.width}
                      height={CARD_IMAGE.thumb.height}
                      sizes="64px"
                      className="h-16 w-auto"
                      fallback={
                        <div className="grid h-16 w-11 place-items-center bg-surface-2 text-[8px] text-muted">
                          ?
                        </div>
                      }
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

function StageHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[4.5rem] w-full flex-col items-center justify-center gap-1">
      {children}
    </div>
  );
}

function StageControls({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[6.75rem] flex-col items-center justify-center gap-3">
      {children}
    </div>
  );
}

function PackCrimp({ edge }: { edge: "top" | "bottom" }) {
  return (
    <div
      aria-hidden
      className={`absolute inset-x-0 z-20 h-4 ${edge === "top" ? "top-0" : "bottom-0"}`}
    >
      <div
        className={`h-full w-full ${
          edge === "top"
            ? "bg-gradient-to-b from-[#c8ccd4] via-[#8b919c] to-[#5c636e]"
            : "bg-gradient-to-t from-[#c8ccd4] via-[#8b919c] to-[#5c636e]"
        }`}
        style={{
          maskImage:
            "repeating-linear-gradient(90deg, #000 0 5px, transparent 5px 8px)",
          WebkitMaskImage:
            "repeating-linear-gradient(90deg, #000 0 5px, transparent 5px 8px)",
        }}
      />
      <div
        className={`absolute inset-x-0 h-px bg-black/40 ${
          edge === "top" ? "bottom-0" : "top-0"
        }`}
      />
    </div>
  );
}

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
            ? {
                x: [0, -6, 6, -8, 8, -10, 10, -6, 0],
                rotateZ: [0, -2, 2, -3, 3, -2, 0],
              }
            : { y: [0, -8, 0] }
      }
      transition={
        ripping
          ? { duration: 0.9, ease: "easeIn" }
          : shaking
            ? { duration: 0.7, repeat: Infinity }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }
      className={`relative h-[22.5rem] w-[15.25rem] select-none sm:h-[26rem] sm:w-[17.5rem] ${
        interactive ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
      style={{ perspective: 900 }}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive && onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={interactive ? `Open ${set.name} booster pack` : undefined}
    >
      {/* Table shadow */}
      <div
        aria-hidden
        className="absolute -bottom-5 left-1/2 h-6 w-[70%] -translate-x-1/2 rounded-[100%] bg-black/70 blur-xl"
      />

      <div className="absolute inset-0 overflow-hidden rounded-[3px] border border-white/20 shadow-[0_28px_70px_rgba(0,0,0,0.55)]">
        {/* Pack body: black / white only */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-black to-[#0a0a0a]"
        />

        {/* Side edge bevel */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/50 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-white/8 to-transparent"
        />

        <PackCrimp edge="top" />
        <PackCrimp edge="bottom" />

        {/* Pack face content */}
        <div className="relative z-10 flex h-full flex-col px-4 pb-6 pt-7 sm:px-5 sm:pb-7 sm:pt-8">
          {/* Brand mark */}
          <div className="flex justify-center">
            <VisionLogo size={34} />
          </div>

          {/* Set logo */}
          <div className="relative mt-5 flex min-h-0 flex-1 items-center justify-center px-2">
            {set.logoUrl ? (
              <div className="relative h-[55%] w-full max-w-[12rem]">
                <SafeImage
                  src={set.logoUrl}
                  alt={set.name}
                  fill
                  sizes="200px"
                  className="object-contain"
                  fallback={
                    <div className="grid h-full place-items-center px-2 text-center text-base font-bold leading-tight text-white">
                      {set.name}
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="px-3 text-center text-lg font-bold leading-tight tracking-tight text-white">
                {set.name}
              </div>
            )}
          </div>

          {/* Footer strip */}
          <div className="mt-4 flex flex-col items-center gap-2.5">
            <div className="flex w-full items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              {set.symbolUrl ? (
                <div className="relative h-7 w-7 shrink-0">
                  <SafeImage
                    src={set.symbolUrl}
                    alt=""
                    fill
                    sizes="28px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="h-1.5 w-1.5 rotate-45 bg-white/70" />
              )}
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </div>
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white">
              Booster Pack
            </div>
          </div>
        </div>

        {/* Rip tear when opening */}
        {ripping && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[42%] z-30 h-8 -translate-y-1/2"
            initial={{ opacity: 0, scaleX: 0.2 }}
            animate={{ opacity: [0, 1, 0.4], scaleX: [0.2, 1.05, 1.1] }}
            transition={{ duration: 0.7 }}
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
              clipPath:
                "polygon(0 40%, 8% 55%, 18% 35%, 30% 60%, 45% 30%, 58% 58%, 72% 38%, 85% 62%, 100% 42%, 100% 58%, 85% 78%, 72% 55%, 58% 75%, 45% 48%, 30% 78%, 18% 52%, 8% 72%, 0 58%)",
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

function RevealStack({
  cards,
  revealIndex,
  onReveal,
  cornerRadius,
}: {
  cards: SerialisedPulledCard[];
  revealIndex: number;
  onReveal?: () => void;
  cornerRadius: string;
}) {
  const card = cards[revealIndex];
  const nextCard = cards[revealIndex + 1];
  const artSrc = card.imageLarge ?? card.imageSmall;
  const cardKey = `${card.id}-${revealIndex}`;
  const isBig = card.rarityTier >= 4;
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const artReady = !artSrc || readyFor === cardKey;
  const cornerStyle = {
    ["--card-corner-radius" as string]: cornerRadius,
  };

  useEffect(() => {
    if (!artSrc) return;
    // Dead/slow URLs shouldn't stall the flip forever.
    const failSafe = window.setTimeout(() => setReadyFor(cardKey), 1200);
    return () => window.clearTimeout(failSafe);
  }, [cardKey, artSrc]);

  // Keep the next couple of cards warm while the player looks at this one.
  useEffect(() => {
    const upcoming = cards
      .slice(revealIndex + 1, revealIndex + 3)
      .flatMap((c) => [c.imageLarge, c.imageSmall]);
    void preloadCardArt(upcoming, { timeoutMs: 3000 });
  }, [cards, revealIndex]);

  return (
    <div
      className={`relative h-[22.5rem] w-64 sm:h-[26rem] sm:w-72 ${
        onReveal ? "cursor-pointer" : "cursor-default"
      }`}
      onClick={onReveal}
      style={{ perspective: 1200, ...cornerStyle }}
    >
      {/* face-down stack behind. Era-matched corners */}
      {cards.length - revealIndex > 1 && (
        <>
          <div className="card-corners absolute inset-0 translate-x-2 translate-y-2 border border-border bg-surface-2" />
          <div className="card-corners absolute inset-0 translate-x-1 translate-y-1 border border-border bg-surface" />
        </>
      )}

      {/* Hidden prefetch so the following flip is already decoded. */}
      {nextCard && (nextCard.imageLarge || nextCard.imageSmall) && (
        <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden>
          <SafeImage
            src={nextCard.imageLarge ?? nextCard.imageSmall}
            alt=""
            width={CARD_IMAGE.xl.width}
            height={CARD_IMAGE.xl.height}
            sizes="288px"
            quality={90}
          />
        </div>
      )}

      <AnimatePresence mode="popLayout">
        <motion.div
          key={cardKey}
          initial={{ rotateY: 180, scale: isBig ? 0.7 : 0.95, opacity: 0.6 }}
          animate={
            artReady
              ? {
                  rotateY: 0,
                  scale: 1,
                  opacity: 1,
                  transition: {
                    duration: isBig ? 0.9 : 0.45,
                    type: "spring",
                    bounce: isBig ? 0.45 : 0.2,
                  },
                }
              : { rotateY: 180, scale: isBig ? 0.7 : 0.95, opacity: 0.85 }
          }
          exit={{ x: -260, rotateZ: -12, opacity: 0, transition: { duration: 0.25 } }}
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className={`relative h-full w-full overflow-hidden ${
              card.rarityTier >= 3 ? `glow-tier-${Math.min(card.rarityTier, 6)}` : ""
            }`}
          >
            <SafeImage
              src={artSrc}
              alt={card.name}
              fill
              sizes="(max-width: 640px) 70vw, 288px"
              quality={90}
              preload
              loading="eager"
              draggable={false}
              className="object-contain"
              onLoad={() => setReadyFor(cardKey)}
              fallback={
                <div className="grid h-full w-full place-items-center bg-surface-2 text-center">
                  {card.name}
                </div>
              }
            />
          </div>

          {isBig && artReady && (
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

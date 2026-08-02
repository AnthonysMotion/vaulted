"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Badge, Button, Card, rarityBadgeColor } from "@/components/ui";
import { CardLightbox } from "@/components/card-lightbox";
import { CardTile, type CardTileData } from "@/components/card-tile";
import { rarityTier } from "@/lib/packs/rarity";

type ShowcaseCard = {
  id: string;
  name: string;
  rarity: string | null;
  imageSmall: string | null;
  imageLarge?: string | null;
  setName?: string | null;
};

type OwnedCard = ShowcaseCard & {
  quantity: number;
  number?: string | null;
  imageLarge?: string | null;
  setName?: string | null;
};

export function ProfileShowcaseCard({
  card,
  isOwner,
}: {
  card: ShowcaseCard | null;
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lightbox, setLightbox] = useState<CardTileData | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const tileCard: CardTileData | null = card
    ? {
        id: card.id,
        name: card.name,
        rarity: card.rarity,
        imageSmall: card.imageSmall,
        imageLarge: card.imageLarge,
        rarityTier: rarityTier(card.rarity),
      }
    : null;

  async function selectCard(cardId: string | null) {
    startTransition(async () => {
      const res = await fetch("/api/profile/showcase-card", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          Showcase
        </h2>
        {isOwner && card && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => setOpen(true)}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-white disabled:opacity-50"
            >
              Change
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => selectCard(null)}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-white disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {card && tileCard ? (
        <div className="flex items-center gap-4">
          <CardTile
            card={tileCard}
            size="sm"
            onClick={() => setLightbox(tileCard)}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-white">
              {card.name}
            </p>
            {card.setName && (
              <p className="mt-1 truncate text-xs text-zinc-500">{card.setName}</p>
            )}
            {card.rarity && (
              <div className="mt-2">
                <Badge color={rarityBadgeColor(rarityTier(card.rarity))}>
                  {card.rarity}
                </Badge>
              </div>
            )}
          </div>
        </div>
      ) : isOwner ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-800 bg-black/40 px-4 py-8 text-center transition-colors hover:border-zinc-600 hover:bg-zinc-950"
        >
          <div className="relative w-16 opacity-40 transition-opacity group-hover:opacity-70">
            <div className="aspect-[63/88] w-full rounded-lg border border-zinc-700 bg-gradient-to-b from-zinc-900 to-black" />
            <span className="absolute inset-0 grid place-items-center text-2xl text-zinc-500">
              +
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">
              Choose a showcase card
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Pick any card you own to feature on your profile
            </p>
          </div>
        </button>
      ) : (
        <p className="py-2 text-sm text-zinc-500">No showcase card yet.</p>
      )}

      <CardLightbox card={lightbox} onClose={() => setLightbox(null)} />

      <AnimatePresence>
        {open && isOwner && (
          <ShowcasePicker
            currentCardId={card?.id ?? null}
            pending={pending}
            onConfirm={(picked) => selectCard(picked.id)}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </Card>
  );
}

function ShowcasePicker({
  currentCardId,
  pending,
  onConfirm,
  onClose,
}: {
  currentCardId: string | null;
  pending: boolean;
  onConfirm: (card: OwnedCard) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OwnedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OwnedCard | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [onClose]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/collection/cards?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        const cards = (data.cards ?? []) as OwnedCard[];
        setResults(cards);
        setSelected((prev) => {
          if (prev && cards.some((c) => c.id === prev.id)) return prev;
          const current = currentCardId
            ? cards.find((c) => c.id === currentCardId)
            : null;
          return current ?? cards[0] ?? null;
        });
      } catch {
        // aborted
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query, currentCardId]);

  function handleConfirm(e: FormEvent) {
    e.preventDefault();
    if (!selected || pending) return;
    onConfirm(selected);
  }

  if (!mounted) return null;

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.form
        onSubmit={handleConfirm}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.18 }}
        className="flex h-[min(640px,90vh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-900 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h3
              id={titleId}
              className="text-base font-bold tracking-tight text-white"
            >
              Feature a card you own
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Select a card, preview it, then confirm.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-zinc-800 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="shrink-0 border-b border-zinc-900 px-4 py-2.5 sm:px-5">
          <label className="relative block">
            <span className="sr-only">Search collection</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by card name…"
              className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
              >
                Clear
              </button>
            ) : null}
          </label>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_200px]">
          <div className="min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4">
            {loading ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[63/88] animate-pulse rounded-md bg-zinc-900"
                  />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="grid h-full place-items-center px-4 py-10 text-center">
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    {query ? "No matching cards" : "Collection is empty"}
                  </p>
                  <p className="mt-2 max-w-xs text-xs text-zinc-600">
                    {query
                      ? "Try another search. Only owned cards can be showcased."
                      : "Open trainer packs first, then pick a favourite."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {results.map((owned) => {
                  const isSelected = selected?.id === owned.id;
                  const isCurrent = currentCardId === owned.id;
                  return (
                    <button
                      key={owned.id}
                      type="button"
                      onClick={() => setSelected(owned)}
                      className={`relative min-w-0 overflow-hidden rounded-md border bg-black transition ${
                        isSelected
                          ? "border-white ring-1 ring-white/40"
                          : "border-zinc-800 hover:border-zinc-500"
                      }`}
                      title={owned.name}
                    >
                      <div className="relative aspect-[63/88] w-full">
                        {owned.imageSmall ? (
                          <img
                            src={owned.imageSmall}
                            alt={owned.name}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center p-1 text-center text-[9px] text-zinc-600">
                            {owned.name}
                          </div>
                        )}
                      </div>
                      {isCurrent && (
                        <span className="absolute left-1 top-1 rounded bg-black/80 px-1 py-px text-[8px] font-bold uppercase tracking-wide text-zinc-300">
                          Current
                        </span>
                      )}
                      {isSelected && (
                        <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-white text-[9px] font-bold text-black">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="hidden min-h-0 flex-col border-l border-zinc-900 bg-black/50 p-4 md:flex">
            <PreviewPane card={selected} />
            <div className="mt-auto flex shrink-0 flex-col gap-2 pt-4">
              <Button
                type="submit"
                disabled={!selected || pending || selected.id === currentCardId}
                className="w-full"
              >
                {pending
                  ? "Saving…"
                  : selected?.id === currentCardId
                    ? "Already showcasing"
                    : "Set as showcase"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </aside>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-zinc-900 px-3 py-3 md:hidden">
          {selected ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded border border-zinc-800">
                {selected.imageSmall ? (
                  <img
                    src={selected.imageSmall}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {selected.name}
                </p>
                <p className="truncate text-[11px] text-zinc-500">
                  {selected.setName ?? "Owned card"}
                </p>
              </div>
            </div>
          ) : (
            <p className="flex-1 text-sm text-zinc-500">Select a card</p>
          )}
          <Button
            type="submit"
            disabled={!selected || pending || selected.id === currentCardId}
            className="shrink-0"
          >
            {pending ? "…" : "Confirm"}
          </Button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  );
}

function PreviewPane({ card }: { card: OwnedCard | null }) {
  if (!card) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="w-28 rounded-lg border border-dashed border-zinc-700 aspect-[63/88]" />
        <p className="mt-3 text-xs text-zinc-500">Select a card to preview</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        Preview
      </p>
      <div className="mx-auto mt-3 w-full max-w-[148px] shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-black">
        <div className="relative aspect-[63/88] w-full">
          {card.imageLarge || card.imageSmall ? (
            <img
              src={card.imageLarge ?? card.imageSmall ?? ""}
              alt={card.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-2 text-center text-[10px] text-zinc-600">
              {card.name}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 min-h-0 text-center">
        <p className="truncate text-sm font-semibold text-white">{card.name}</p>
        <p className="mt-1 truncate text-[11px] text-zinc-500">
          {[card.setName, card.number ? `#${card.number}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {card.rarity && (
          <div className="mt-2 flex justify-center">
            <Badge color={rarityBadgeColor(rarityTier(card.rarity))}>
              {card.rarity}
            </Badge>
          </div>
        )}
        <p className="mt-2 text-[11px] text-zinc-600">{card.quantity} owned</p>
      </div>
    </div>
  );
}

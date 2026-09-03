"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Badge, Button, rarityBadgeColor } from "@/components/ui";
import { SafeImage } from "@/components/safe-image";
import { rarityTier } from "@/lib/packs/rarity";
import { useIsClient } from "@/lib/use-is-client";

export type CollectionOwnedCard = {
  id: string;
  name: string;
  rarity: string | null;
  imageSmall: string | null;
  imageLarge?: string | null;
  number?: string | null;
  setName?: string | null;
  quantity: number;
};

type CollectionCardPickerProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (card: CollectionOwnedCard) => void;
  pending?: boolean;
  currentCardId?: string | null;
  title?: string;
  description?: string;
  confirmLabel?: string;
  confirmingLabel?: string;
  alreadySelectedLabel?: string;
  emptyHint?: string;
};

export function CollectionCardPicker({
  open,
  onClose,
  onConfirm,
  pending = false,
  currentCardId = null,
  title = "Pick a card you own",
  description = "Select a card, preview it, then confirm.",
  confirmLabel = "Confirm",
  confirmingLabel = "Saving…",
  alreadySelectedLabel = "Already selected",
  emptyHint = "Open trainer packs first, then come back to pick a card.",
}: CollectionCardPickerProps) {
  return (
    <AnimatePresence>
      {open && (
        <PickerDialog
          currentCardId={currentCardId}
          pending={pending}
          title={title}
          description={description}
          confirmLabel={confirmLabel}
          confirmingLabel={confirmingLabel}
          alreadySelectedLabel={alreadySelectedLabel}
          emptyHint={emptyHint}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  );
}

function PickerDialog({
  currentCardId,
  pending,
  title,
  description,
  confirmLabel,
  confirmingLabel,
  alreadySelectedLabel,
  emptyHint,
  onConfirm,
  onClose,
}: {
  currentCardId: string | null;
  pending: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmingLabel: string;
  alreadySelectedLabel: string;
  emptyHint: string;
  onConfirm: (card: CollectionOwnedCard) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const mounted = useIsClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CollectionOwnedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CollectionOwnedCard | null>(null);

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
        const cards = (data.cards ?? []) as CollectionOwnedCard[];
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

  const alreadySelected = Boolean(selected && selected.id === currentCardId);

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
        className="flex h-[min(640px,90vh)] w-full max-w-3xl flex-col overflow-hidden border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h3
              id={titleId}
              className="text-base font-bold tracking-tight text-white"
            >
              {title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-2">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center border border-border text-sm text-muted transition-colors hover:border-zinc-600 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="shrink-0 border-b border-border px-4 py-2.5 sm:px-5">
          <label className="relative block">
            <span className="sr-only">Search collection</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by card name…"
              className="w-full border border-border bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-muted-2 focus:border-zinc-500"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-2 hover:text-white"
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
                    className="aspect-[63/88] animate-pulse bg-surface-2"
                  />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="grid h-full place-items-center px-4 py-10 text-center">
                <div>
                  <p className="text-sm font-medium text-category">
                    {query ? "No matching cards" : "Collection is empty"}
                  </p>
                  <p className="mt-2 max-w-xs text-xs text-muted-2">
                    {query
                      ? "Try another search. Only owned cards can be selected."
                      : emptyHint}
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
                      className={`relative min-w-0 overflow-hidden border bg-black transition ${
                        isSelected
                          ? "border-white ring-1 ring-white/40"
                          : "border-border hover:border-zinc-500"
                      }`}
                      title={owned.name}
                    >
                      <div className="relative aspect-[63/88] w-full">
                        <SafeImage
                          src={owned.imageSmall}
                          alt={owned.name}
                          fill
                          sizes="(max-width: 768px) 18vw, 96px"
                          className="object-cover"
                          fallback={
                            <div className="absolute inset-0 grid place-items-center p-1 text-center text-[9px] text-muted-2">
                              {owned.name}
                            </div>
                          }
                        />
                      </div>
                      {isCurrent && (
                        <span className="absolute left-1 top-1 bg-black/80 px-1 py-px text-[8px] font-bold uppercase tracking-wide text-category">
                          Current
                        </span>
                      )}
                      {isSelected && (
                        <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center bg-white text-[9px] font-bold text-black">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="hidden min-h-0 flex-col border-l border-border bg-black/50 p-4 md:flex">
            <PreviewPane card={selected} />
            <div className="mt-auto flex shrink-0 flex-col gap-2 pt-4">
              <Button
                type="submit"
                disabled={!selected || pending || alreadySelected}
                className="w-full"
              >
                {pending
                  ? confirmingLabel
                  : alreadySelected
                    ? alreadySelectedLabel
                    : confirmLabel}
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

        <div className="flex shrink-0 items-center gap-3 border-t border-border px-3 py-3 md:hidden">
          {selected ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="relative h-12 w-9 shrink-0 overflow-hidden border border-border">
                <SafeImage
                  src={selected.imageSmall}
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {selected.name}
                </p>
                <p className="truncate text-[11px] text-muted-2">
                  {selected.setName ?? "Owned card"}
                </p>
              </div>
            </div>
          ) : (
            <p className="flex-1 text-sm text-muted-2">Select a card</p>
          )}
          <Button
            type="submit"
            disabled={!selected || pending || alreadySelected}
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

function PreviewPane({ card }: { card: CollectionOwnedCard | null }) {
  if (!card) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="aspect-[63/88] w-28 border border-dashed border-border" />
        <p className="mt-3 text-xs text-muted-2">Select a card to preview</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-2">
        Preview
      </p>
      <div className="mx-auto mt-3 w-full max-w-[148px] shrink-0 overflow-hidden border border-border bg-black">
        <div className="relative aspect-[63/88] w-full">
          <SafeImage
            src={card.imageLarge ?? card.imageSmall}
            alt={card.name}
            fill
            sizes="148px"
            className="object-cover"
            fallback={
              <div className="absolute inset-0 grid place-items-center p-2 text-center text-[10px] text-muted-2">
                {card.name}
              </div>
            }
          />
        </div>
      </div>
      <div className="mt-3 min-h-0 text-center">
        <p className="truncate text-sm font-semibold text-white">{card.name}</p>
        <p className="mt-1 truncate text-[11px] text-muted-2">
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
        <p className="mt-2 text-[11px] text-muted-2">{card.quantity} owned</p>
      </div>
    </div>
  );
}

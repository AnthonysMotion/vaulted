"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { rarityTier } from "@/lib/packs/rarity";
import { Button, Spinner } from "./ui";

export type BinderSlotData = {
  position: number;
  cardId: string;
  name: string;
  rarity: string | null;
  imageSmall: string | null;
  isFavourite: boolean;
};

type OwnedCard = {
  id: string;
  name: string;
  rarity: string | null;
  imageSmall: string | null;
  quantity: number;
};

/**
 * 3x3 showcase binder. Owners can drag cards between slots to rearrange,
 * click an empty slot to add an owned card, and star a favourite.
 */
export function BinderEditor({
  initialSlots,
  editable,
}: {
  initialSlots: BinderSlotData[];
  editable: boolean;
}) {
  const [slots, setSlots] = useState<(BinderSlotData | null)[]>(() => {
    const grid: (BinderSlotData | null)[] = Array(9).fill(null);
    for (const s of initialSlots) if (s.position >= 0 && s.position < 9) grid[s.position] = s;
    return grid;
  });
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const save = useCallback(async (next: (BinderSlotData | null)[]) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/binder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slots: next
            .map((s, i) => (s ? { position: i, cardId: s.cardId, isFavourite: s.isFavourite } : null))
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Save failed");
      } else {
        setDirty(false);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }, []);

  const mutate = useCallback((updater: (prev: (BinderSlotData | null)[]) => (BinderSlotData | null)[]) => {
    setSlots((prev) => {
      const next = updater(prev);
      setDirty(true);
      return next;
    });
  }, []);

  function handleDragEnd(fromIndex: number, point: { x: number; y: number }) {
    let target = -1;
    cellRefs.current.forEach((cell, i) => {
      if (!cell || i === fromIndex) return;
      const rect = cell.getBoundingClientRect();
      if (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) {
        target = i;
      }
    });
    if (target === -1) return;
    mutate((prev) => {
      const next = [...prev];
      const a = next[target];
      const b = next[fromIndex];
      next[fromIndex] = a ? { ...a, position: fromIndex } : null;
      next[target] = b ? { ...b, position: target } : null;
      return next;
    });
  }

  function toggleFavourite(index: number) {
    mutate((prev) =>
      prev.map((s, i) =>
        s ? { ...s, isFavourite: i === index ? !s.isFavourite : false } : s,
      ),
    );
  }

  function removeCard(index: number) {
    mutate((prev) => prev.map((s, i) => (i === index ? null : s)));
  }

  function placeCard(index: number, card: OwnedCard) {
    mutate((prev) => {
      const next = [...prev];
      next[index] = {
        position: index,
        cardId: card.id,
        name: card.name,
        rarity: card.rarity,
        imageSmall: card.imageSmall,
        isFavourite: false,
      };
      return next;
    });
    setPickerFor(null);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid w-full max-w-xl grid-cols-3 gap-2 rounded-3xl border border-border bg-surface p-3 sm:gap-3 sm:p-5">
        {slots.map((slot, i) => (
          <div
            key={i}
            ref={(el) => {
              cellRefs.current[i] = el;
            }}
            className="relative aspect-[63/88] rounded-xl border border-dashed border-border bg-surface-2"
          >
            {slot ? (
              <motion.div
                layout
                drag={editable}
                dragSnapToOrigin
                whileDrag={{ scale: 1.08, zIndex: 30 }}
                onDragEnd={(_, info) => handleDragEnd(i, info.point)}
                className={`absolute inset-0 ${editable ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                <div
                  className={`h-full w-full overflow-hidden rounded-xl ${
                    rarityTier(slot.rarity) >= 3
                      ? `glow-tier-${Math.min(rarityTier(slot.rarity), 6)}`
                      : ""
                  }`}
                >
                  {slot.imageSmall ? (
                    <img
                      src={slot.imageSmall}
                      alt={slot.name}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center p-1 text-center text-[10px]">
                      {slot.name}
                    </div>
                  )}
                </div>
                {slot.isFavourite && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-lg drop-shadow">
                    ⭐
                  </span>
                )}
                {editable && (
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 rounded-b-xl bg-black/60 py-1 opacity-0 transition-opacity hover:opacity-100">
                    <button
                      onClick={() => toggleFavourite(i)}
                      title="Favourite showcase card"
                      className="text-xs cursor-pointer"
                    >
                      {slot.isFavourite ? "★" : "☆"}
                    </button>
                    <button
                      onClick={() => removeCard(i)}
                      title="Remove"
                      className="text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </motion.div>
            ) : editable ? (
              <button
                onClick={() => setPickerFor(i)}
                className="grid h-full w-full place-items-center text-2xl text-muted transition-colors hover:text-primary cursor-pointer"
                title="Add a card"
              >
                +
              </button>
            ) : (
              <div className="grid h-full w-full place-items-center text-muted/40">·</div>
            )}
          </div>
        ))}
      </div>

      {editable && (
        <div className="flex items-center gap-3">
          <Button onClick={() => save(slots)} disabled={!dirty || saving}>
            {saving ? "Saving..." : dirty ? "Save binder" : "Saved"}
          </Button>
          <span className="text-xs text-muted">Drag cards to rearrange · ☆ to feature</span>
        </div>
      )}

      {pickerFor !== null && (
        <CardPicker onPick={(card) => placeCard(pickerFor, card)} onClose={() => setPickerFor(null)} />
      )}
    </div>
  );
}

function CardPicker({
  onPick,
  onClose,
}: {
  onPick: (card: OwnedCard) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OwnedCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/collection/cards?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data.cards ?? []);
      } catch {
        // aborted or failed; keep previous results
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Pick a card you own</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground cursor-pointer">
            ✕
          </button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your collection..."
          className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="grid flex-1 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <Spinner />
            </div>
          ) : results.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-muted">
              No owned cards match. You can only showcase cards you own.
            </p>
          ) : (
            results.map((card) => (
              <button
                key={card.id}
                onClick={() => onPick(card)}
                className="overflow-hidden rounded-lg transition-transform hover:scale-105 cursor-pointer"
                title={`${card.name} (${card.rarity ?? "?"})`}
              >
                {card.imageSmall ? (
                  <img src={card.imageSmall} alt={card.name} className="w-full" loading="lazy" />
                ) : (
                  <div className="grid aspect-[63/88] place-items-center bg-surface-2 p-1 text-center text-[9px]">
                    {card.name}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

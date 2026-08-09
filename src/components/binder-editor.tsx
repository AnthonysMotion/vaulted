"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { rarityTier } from "@/lib/packs/rarity";
import { SafeImage } from "@/components/safe-image";
import { Button } from "./ui";
import {
  CollectionCardPicker,
  type CollectionOwnedCard,
} from "./collection-card-picker";

export type BinderSlotData = {
  position: number;
  cardId: string;
  name: string;
  rarity: string | null;
  imageSmall: string | null;
  isFavourite: boolean;
};

/**
 * 3x3 showcase binder. Owners can drag cards between slots to rearrange,
 * click an empty slot to add an owned card, and star a favourite.
 */
export function BinderEditor({
  initialSlots,
  editable,
  align = "center",
}: {
  initialSlots: BinderSlotData[];
  editable: boolean;
  align?: "center" | "start";
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

  function placeCard(index: number, card: CollectionOwnedCard) {
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
    <div
      className={`flex flex-col gap-4 ${align === "start" ? "items-start" : "items-center"}`}
    >
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid w-full max-w-xl grid-cols-3 gap-2 border border-border bg-surface p-3 sm:gap-3 sm:p-5">
        {slots.map((slot, i) => (
          <div
            key={i}
            ref={(el) => {
              cellRefs.current[i] = el;
            }}
            className="relative aspect-[63/88] border border-dashed border-border bg-surface-2"
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
                  className={`relative h-full w-full overflow-hidden ${
                    rarityTier(slot.rarity) >= 3
                      ? `glow-tier-${Math.min(rarityTier(slot.rarity), 6)}`
                      : ""
                  }`}
                >
                  <SafeImage
                    src={slot.imageSmall}
                    alt={slot.name}
                    fill
                    sizes="(max-width: 640px) 28vw, 120px"
                    draggable={false}
                    className="object-cover"
                    fallback={
                      <div className="grid h-full w-full place-items-center p-1 text-center text-[10px]">
                        {slot.name}
                      </div>
                    }
                  />
                </div>
                {slot.isFavourite && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-lg drop-shadow">
                    ⭐
                  </span>
                )}
                {editable && (
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1-xl bg-black/60 py-1 opacity-0 transition-opacity hover:opacity-100">
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
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Button onClick={() => save(slots)} disabled={!dirty || saving} className="w-full sm:w-auto">
            {saving ? "Saving..." : dirty ? "Save binder" : "Saved"}
          </Button>
          <span className="text-center text-xs text-muted sm:text-left">
            Drag cards to rearrange · ☆ to feature
          </span>
        </div>
      )}

      <CollectionCardPicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        title="Add a card to your binder"
        description="Select a card, preview it, then confirm."
        confirmLabel="Add to binder"
        emptyHint="Open trainer packs first, then add cards to your binder."
        onConfirm={(card) => {
          if (pickerFor !== null) placeCard(pickerFor, card);
        }}
      />
    </div>
  );
}

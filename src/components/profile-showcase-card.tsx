"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card, rarityBadgeColor } from "@/components/ui";
import { CardLightbox } from "@/components/card-lightbox";
import { CardTile, type CardTileData } from "@/components/card-tile";
import { CollectionCardPicker } from "@/components/collection-card-picker";
import { rarityTier } from "@/lib/packs/rarity";

type ShowcaseCard = {
  id: string;
  name: string;
  rarity: string | null;
  imageSmall: string | null;
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

      {isOwner && (
        <CollectionCardPicker
          open={open}
          onClose={() => setOpen(false)}
          pending={pending}
          currentCardId={card?.id ?? null}
          title="Feature a card you own"
          description="Select a card, preview it, then confirm."
          confirmLabel="Set as showcase"
          confirmingLabel="Saving…"
          alreadySelectedLabel="Already showcasing"
          emptyHint="Open trainer packs first, then pick a favourite."
          onConfirm={(picked) => selectCard(picked.id)}
        />
      )}
    </Card>
  );
}

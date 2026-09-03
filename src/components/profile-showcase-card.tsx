"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, rarityBadgeColor } from "@/components/ui";
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
  marketPrice?: number | null;
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
        marketPrice: card.marketPrice ?? null,
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
    <div className="relative border border-border bg-background p-6 sm:p-8">
      {isOwner && card ? (
        <div className="absolute right-6 top-6 z-10 flex items-center gap-4 sm:right-8 sm:top-8">
          <button
            type="button"
            disabled={pending}
            onClick={() => setOpen(true)}
            className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-category transition-colors hover:text-white disabled:opacity-50"
          >
            Change
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => selectCard(null)}
            className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted transition-colors hover:text-white disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      ) : null}

      {card && tileCard ? (
        <div className="flex min-h-[10.5rem] items-center gap-5">
          <CardTile
            card={tileCard}
            size="sm"
            priority
            onClick={() => setLightbox(tileCard)}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-medium tracking-[-0.02em] text-white">
              {card.name}
            </p>
            {card.setName && (
              <p className="mt-1 truncate font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted">
                {card.setName}
              </p>
            )}
            {card.rarity && (
              <div className="mt-3">
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
          className="group flex w-full flex-col items-center gap-4 border border-dashed border-border bg-surface/40 px-4 py-10 text-center transition-colors hover:border-muted hover:bg-surface"
        >
          <div className="relative w-16 opacity-40 transition-opacity group-hover:opacity-70">
            <div className="aspect-[63/88] w-full border border-border bg-gradient-to-b from-surface-2 to-black" />
            <span className="absolute inset-0 grid place-items-center text-2xl text-muted-2">
              +
            </span>
          </div>
          <div>
            <p className="text-sm font-medium tracking-[-0.02em] text-white">
              Choose a showcase card
            </p>
            <p className="mt-1 text-xs text-muted-2">
              Pick any card you own to feature on your profile
            </p>
          </div>
        </button>
      ) : (
        <p className="py-2 text-sm text-muted-2">No showcase card yet.</p>
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
    </div>
  );
}

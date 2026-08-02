"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, rarityBadgeColor } from "@/components/ui";
import { rarityTier } from "@/lib/packs/rarity";

type ShowcaseCard = {
  id: string;
  name: string;
  rarity: string | null;
  imageSmall: string | null;
};

type OwnedCard = ShowcaseCard & { quantity: number };

export function ProfileShowcaseCard({
  card,
  isOwner,
}: {
  card: ShowcaseCard | null;
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

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
    <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          Showcase
        </h2>
        {isOwner && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setOpen(true)}
            className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-white disabled:opacity-50"
          >
            {card ? "Change" : "Pick card"}
          </button>
        )}
      </div>

      {card ? (
        <div className="flex items-center gap-3">
          <div className="w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-black sm:w-24">
            <div className="aspect-[63/88]">
              {card.imageSmall ? (
                <img
                  src={card.imageSmall}
                  alt={card.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center p-2 text-center text-[10px] text-zinc-600">
                  {card.name}
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{card.name}</p>
            {card.rarity && (
              <div className="mt-1.5">
                <Badge color={rarityBadgeColor(rarityTier(card.rarity))}>
                  {card.rarity}
                </Badge>
              </div>
            )}
            {isOwner && (
              <button
                type="button"
                disabled={pending}
                onClick={() => selectCard(null)}
                className="mt-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="py-2 text-sm text-zinc-500">
          {isOwner ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-left text-zinc-400 underline underline-offset-4 hover:text-white"
            >
              Pick a card from your collection to show off.
            </button>
          ) : (
            <p>No showcase card yet.</p>
          )}
        </div>
      )}

      {open && isOwner && (
        <CardPicker
          onPick={(picked) => selectCard(picked.id)}
          onClose={() => setOpen(false)}
        />
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
        const res = await fetch(
          `/api/collection/cards?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setResults(data.cards ?? []);
      } catch {
        // aborted
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
        className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-4 overflow-hidden rounded-2xl border border-zinc-800 bg-black p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">Pick a showcase card</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white"
          >
            ✕
          </button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your collection..."
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
        />
        <div className="grid flex-1 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
          {loading ? (
            <div className="col-span-full py-8 text-center text-sm text-zinc-500">
              Loading…
            </div>
          ) : results.length === 0 ? (
            <div className="col-span-full py-8 text-center text-sm text-zinc-500">
              No owned cards match. You can only showcase cards you own.
            </div>
          ) : (
            results.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onPick(card)}
                className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 transition hover:border-zinc-500"
                title={card.name}
              >
                <div className="aspect-[63/88]">
                  {card.imageSmall ? (
                    <img
                      src={card.imageSmall}
                      alt={card.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center p-1 text-[9px] text-zinc-600">
                      {card.name}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import { CardGallery } from "./card-gallery";
import { CardTile, type CardTileData } from "./card-tile";
import { formatMarketPrice } from "@/lib/game/card-price";

type CollectionGalleryCard = CardTileData & {
  setCode: string;
  number: string;
};

export function CollectionCardGallery({
  cards,
}: {
  cards: CollectionGalleryCard[];
}) {
  return (
    <CardGallery cards={cards}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
        {cards.map((card) => {
          const price = formatMarketPrice(card.marketPrice);
          return (
          <button
            key={card.id}
            type="button"
            data-card-id={card.id}
            className="group flex cursor-pointer flex-col gap-3 text-left"
          >
            <div className="relative aspect-[63/88] w-full transition-transform duration-300 group-hover:-translate-y-1">
              <CardTile card={card} size="lg" />
            </div>
            <div className="px-1">
              <div className="mb-1 truncate text-xs font-bold text-white">{card.name}</div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-700">
                  {card.setCode} · #{card.number}
                </div>
                {price && (
                  <div className="font-mono text-[10px] tabular-nums text-muted">
                    {price}
                  </div>
                )}
              </div>
            </div>
          </button>
          );
        })}
      </div>
    </CardGallery>
  );
}

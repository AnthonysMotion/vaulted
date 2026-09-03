import { CatalogImage } from "@/components/catalog-image";

export type CardTileData = {
  id: string;
  name: string;
  rarity: string | null;
  imageSmall: string | null;
  imageLarge?: string | null;
  reverseHolo?: boolean;
  rarityTier: number;
  quantity?: number;
  /** Cached TCGplayer market USD for this finish. Refreshed in the lightbox. */
  marketPrice?: number | null;
};

export function CardTile({
  card,
  size = "md",
  onClick,
  priority = false,
}: {
  card: CardTileData;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  priority?: boolean;
}) {
  const glow = card.rarityTier >= 3 ? `glow-tier-${Math.min(card.rarityTier, 6)}` : "";
  const sizes = { sm: "w-24", md: "w-36", lg: "w-full max-w-56" };
  const className = `relative ${sizes[size]} shrink-0 ${
    priority
      ? ""
      : "[content-visibility:auto] [contain-intrinsic-size:auto_280px]"
  } transition-transform duration-200 hover:scale-105 ${onClick ? "cursor-pointer" : ""}`;

  const body = (
    <>
      <div className={`relative aspect-[63/88] overflow-hidden ${glow}`}>
        <CatalogImage
          src={card.imageSmall}
          alt={card.name}
          fill
          priority={priority}
          loading={priority ? "eager" : undefined}
          sizes={
            size === "lg"
              ? "(max-width: 640px) 45vw, 224px"
              : size === "sm"
                ? "96px"
                : "(max-width: 640px) 30vw, 144px"
          }
          className="object-cover"
          fallback={
            <div className="grid h-full w-full place-items-center bg-surface-2 p-2 text-center text-xs text-muted">
              {card.name}
            </div>
          }
        />
      </div>
      {card.quantity !== undefined && card.quantity > 1 && (
        <span className="absolute -right-1.5 -top-1.5 grid min-w-6 place-items-center border border-border bg-surface px-1 font-mono text-xs font-normal text-accent">
          ×{card.quantity}
        </span>
      )}
      {card.reverseHolo && (
        <span className="absolute bottom-1 left-1 bg-accent/90 px-1 py-px font-mono text-[9px] font-normal uppercase text-white">
          Reverse
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}

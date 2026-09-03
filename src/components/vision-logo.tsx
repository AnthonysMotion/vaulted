import Image from "next/image";

/** Public path for the brand mark (`public/brand/LOGO.svg`). */
export const VISION_LOGO_SRC = "/brand/LOGO.svg";

export function VisionLogo({
  size = 22,
  className = "",
  priority = false,
  currentColor = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
  /** Fill the mark with `currentColor` (for hover tints). */
  currentColor?: boolean;
}) {
  if (currentColor) {
    return (
      <span
        aria-hidden
        className={`inline-block shrink-0 bg-current ${className}`.trim()}
        style={{
          width: size,
          height: size,
          maskImage: `url(${VISION_LOGO_SRC})`,
          WebkitMaskImage: `url(${VISION_LOGO_SRC})`,
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }}
      />
    );
  }

  return (
    <Image
      src={VISION_LOGO_SRC}
      alt=""
      width={size}
      height={size}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      className={`shrink-0 object-contain ${className}`.trim()}
      aria-hidden
    />
  );
}

/** Logo + wordmark. Mark sized to read as a peer of the text. */
export function VisionWordmark({
  logoSize = 36,
  priority = false,
  className = "",
  label = "Vision",
  textClassName = "text-[17px] font-semibold tracking-[-0.03em] text-current",
}: {
  logoSize?: number;
  priority?: boolean;
  className?: string;
  label?: string;
  textClassName?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 text-white ${className}`.trim()}
    >
      <VisionLogo size={logoSize} priority={priority} currentColor />
      <span className={textClassName}>{label}</span>
    </span>
  );
}

import Image from "next/image";

/** Public path for the brand mark (`public/brand/LOGO.svg`). */
export const VISION_LOGO_SRC = "/brand/LOGO.svg";

export function VisionLogo({
  size = 22,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={VISION_LOGO_SRC}
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 object-contain ${className}`.trim()}
      aria-hidden
    />
  );
}

/** Logo + wordmark — mark sized to read as a peer of the text. */
export function VisionWordmark({
  logoSize = 36,
  priority = false,
  className = "",
  label = "Vision",
  textClassName = "text-[17px] font-semibold tracking-[-0.03em] text-white",
}: {
  logoSize?: number;
  priority?: boolean;
  className?: string;
  label?: string;
  textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      <VisionLogo size={logoSize} priority={priority} />
      <span className={textClassName}>{label}</span>
    </span>
  );
}

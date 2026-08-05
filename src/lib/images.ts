/** Hosts we route through Next.js Image Optimization (`/_next/image`). */
const OPTIMIZABLE_HOST_SUFFIXES = [
  "images.pokemontcg.io",
  "googleusercontent.com",
  "ggpht.com",
  "avatars.githubusercontent.com",
  "cdn.discordapp.com",
  "media.discordapp.net",
  "i.imgur.com",
  "supabase.co",
] as const;

export function isOptimizableImageUrl(src: string): boolean {
  try {
    const { protocol, hostname } = new URL(src);
    if (protocol !== "https:") return false;
    return OPTIMIZABLE_HOST_SUFFIXES.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

/** Card art sizes for `next/image` `sizes` / intrinsic dims (TCG ratio ≈ 63:88). */
export const CARD_IMAGE = {
  thumb: { width: 46, height: 64 },
  sm: { width: 96, height: 134 },
  md: { width: 144, height: 201 },
  lg: { width: 245, height: 342 },
  xl: { width: 367, height: 512 },
  hires: { width: 734, height: 1024 },
} as const;

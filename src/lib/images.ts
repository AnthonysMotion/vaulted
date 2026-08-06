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

/** Widths the reveal UI typically requests via `sizes`. */
const REVEAL_OPTIMIZER_WIDTHS = [384, 640] as const;

function optimizerUrl(src: string, width: number, quality = 90): string {
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality),
  });
  return `/_next/image?${params.toString()}`;
}

function loadOne(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/** Warm browser + `/_next/image` cache so reveal flips aren't blank. */
export function preloadCardArt(
  urls: Array<string | null | undefined>,
  options?: { quality?: number; timeoutMs?: number },
): Promise<void> {
  const quality = options?.quality ?? 90;
  const timeoutMs = options?.timeoutMs ?? 4000;
  const unique = [...new Set(urls.filter((u): u is string => Boolean(u)))];
  if (unique.length === 0) return Promise.resolve();

  const targets = new Set<string>();
  for (const src of unique) {
    targets.add(src);
    if (isOptimizableImageUrl(src)) {
      for (const w of REVEAL_OPTIMIZER_WIDTHS) {
        targets.add(optimizerUrl(src, w, quality));
      }
    }
  }

  const loading = Promise.all([...targets].map(loadOne)).then(() => undefined);
  if (timeoutMs <= 0) return loading;

  return Promise.race([
    loading,
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

import Image, { type ImageProps } from "next/image";
import type { ReactNode } from "react";
import { isOptimizableImageUrl } from "@/lib/images";

type CatalogImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string | null | undefined;
  alt: string;
  fallback?: ReactNode;
};

/**
 * Server-friendly `next/image` for trusted catalog CDNs (PTCG art, set logos).
 * User-uploaded / arbitrary hosts should keep using client `SafeImage`.
 */
export function CatalogImage({
  src,
  alt,
  fallback = null,
  className,
  fill,
  width,
  height,
  sizes,
  ...rest
}: CatalogImageProps) {
  const active = typeof src === "string" && src.length > 0 ? src : null;
  if (!active) return <>{fallback}</>;

  if (!isOptimizableImageUrl(active)) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- non-optimizer hosts
        <img
          src={active}
          alt={alt}
          className={className}
          decoding="async"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- non-optimizer hosts
      <img
        src={active}
        alt={alt}
        className={className}
        width={typeof width === "number" ? width : undefined}
        height={typeof height === "number" ? height : undefined}
        decoding="async"
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={active}
        alt={alt}
        fill
        sizes={sizes ?? "100vw"}
        className={className}
        {...rest}
      />
    );
  }

  return (
    <Image
      src={active}
      alt={alt}
      width={width as number}
      height={height as number}
      sizes={sizes}
      className={className}
      {...rest}
    />
  );
}

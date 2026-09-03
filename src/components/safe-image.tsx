"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode, type SyntheticEvent } from "react";
import { isOptimizableImageUrl } from "@/lib/images";

type SafeImageProps = Omit<ImageProps, "src" | "alt" | "onError" | "onLoad"> & {
  src: string | null | undefined;
  alt: string;
  /** Rendered when `src` is missing or the image fails to load. */
  fallback?: ReactNode;
  onError?: ImageProps["onError"];
  onLoad?: ImageProps["onLoad"];
};

type LoadState = {
  src: string | null;
  /** Try `/_next/image` first; degrade to the original URL on optimizer failure. */
  direct: boolean;
  dead: boolean;
};

/**
 * `next/image` wrapper with dead-art fallbacks.
 * Optimizable CDN hosts go through `/_next/image` first; on failure (common on
 * Safari with broken optimized payloads) we retry the original URL before
 * showing the dead-art fallback.
 */
export function SafeImage({
  src,
  alt,
  fallback = null,
  className,
  onError,
  onLoad,
  fill,
  width,
  height,
  sizes,
  ...rest
}: SafeImageProps) {
  const active = typeof src === "string" && src.length > 0 ? src : null;
  const [load, setLoad] = useState<LoadState>({
    src: active,
    direct: false,
    dead: false,
  });

  // Reset when the URL changes (React-recommended render-time adjustment).
  if (active !== load.src) {
    setLoad({ src: active, direct: false, dead: false });
  }

  if (!active || (load.src === active && load.dead)) {
    return <>{fallback}</>;
  }

  const useOptimizer = isOptimizableImageUrl(active) && !load.direct;

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    if (useOptimizer) {
      // Optimizer payload failed. Serve the original remote URL before
      // declaring the art dead (Safari often trips on Next-encoded AVIF/WebP).
      setLoad({ src: active, direct: true, dead: false });
      return;
    }
    setLoad({ src: active, direct: true, dead: true });
    onError?.(event);
  };

  if (!useOptimizer) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- direct / arbitrary hosts
        <img
          src={active}
          alt={alt}
          className={className}
          onError={handleError}
          onLoad={onLoad}
          decoding="async"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element -- direct / arbitrary hosts
      <img
        src={active}
        alt={alt}
        className={className}
        width={typeof width === "number" ? width : undefined}
        height={typeof height === "number" ? height : undefined}
        onError={handleError}
        onLoad={onLoad}
        decoding="async"
        loading={rest.loading}
        draggable={rest.draggable as boolean | undefined}
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
        onError={handleError}
        onLoad={onLoad}
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
      onError={handleError}
      onLoad={onLoad}
      {...rest}
    />
  );
}

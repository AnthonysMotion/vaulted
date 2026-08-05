"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode, type SyntheticEvent } from "react";
import { isOptimizableImageUrl } from "@/lib/images";

type SafeImageProps = Omit<ImageProps, "src" | "alt" | "onError"> & {
  src: string | null | undefined;
  alt: string;
  /** Rendered when `src` is missing or the image fails to load. */
  fallback?: ReactNode;
  onError?: ImageProps["onError"];
};

/**
 * `next/image` wrapper with dead-art fallbacks.
 * Optimizable CDN hosts go through `/_next/image`; other remote URLs use a
 * native `<img>` so arbitrary user avatar/banner URLs still work.
 */
export function SafeImage({
  src,
  alt,
  fallback = null,
  className,
  onError,
  fill,
  width,
  height,
  sizes,
  ...rest
}: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const active = typeof src === "string" && src.length > 0 ? src : null;
  const failed = active !== null && failedSrc === active;

  if (!active || failed) {
    return <>{fallback}</>;
  }

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    setFailedSrc(active);
    onError?.(event);
  };

  const optimizable = isOptimizableImageUrl(active);

  if (!optimizable) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts
        <img
          src={active}
          alt={alt}
          className={className}
          onError={handleError}
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
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts
      <img
        src={active}
        alt={alt}
        className={className}
        width={typeof width === "number" ? width : undefined}
        height={typeof height === "number" ? height : undefined}
        onError={handleError}
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
      {...rest}
    />
  );
}

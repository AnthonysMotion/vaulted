"use client";

import { useState } from "react";
import { SafeImage } from "@/components/safe-image";

function previewUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return value;
  } catch {
    return null;
  }
}

const inputClass =
  "h-12 w-full border border-border bg-surface px-4 text-white outline-none transition-colors focus:border-zinc-600";

const labelClass =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2";

export function AccountImageFields({
  initialAvatarUrl,
  initialBannerUrl,
}: {
  initialAvatarUrl: string;
  initialBannerUrl: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl);

  const avatarPreview = previewUrl(avatarUrl);
  const bannerPreview = previewUrl(bannerUrl);

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-2 text-sm">
        <span className={labelClass}>Avatar image URL</span>
        <input
          name="avatarUrl"
          type="url"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          placeholder="https://"
          className={inputClass}
        />
        <div className="relative grid h-20 w-20 place-items-center overflow-hidden border border-border bg-background">
          <SafeImage
            src={avatarPreview}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
            fallback={
              <span className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted-2">
                Avatar
              </span>
            }
          />
        </div>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className={labelClass}>Banner image URL</span>
        <input
          name="bannerUrl"
          type="url"
          value={bannerUrl}
          onChange={(event) => setBannerUrl(event.target.value)}
          placeholder="https://"
          className={inputClass}
        />
        <div className="relative h-28 overflow-hidden border border-border bg-background">
          <SafeImage
            src={bannerPreview}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover"
            fallback={
              <span className="absolute inset-0 grid place-items-center font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted-2">
                Banner
              </span>
            }
          />
        </div>
      </label>
    </div>
  );
}

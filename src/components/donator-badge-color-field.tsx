"use client";

import { useState } from "react";
import {
  DEFAULT_DONATOR_BADGE_COLOR,
  donatorBadgeColor,
  parseBadgeColor,
} from "@/lib/game/donator";
import { ProfileRoleBadge } from "@/components/profile-role-badge";

export function DonatorBadgeColorField({
  storedColor,
}: {
  storedColor: string | null;
}) {
  const [color, setColor] = useState(donatorBadgeColor(storedColor));

  function apply(next: string) {
    const parsed = parseBadgeColor(next);
    if (parsed) setColor(parsed);
  }

  return (
    <div className="flex flex-col gap-3 border border-border bg-black/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">
            Donator badge
          </div>
          <p className="mt-2 max-w-md text-sm text-muted-2">
            Shown on your public profile. Green by default. Pick any color you
            like.
          </p>
        </div>
        <ProfileRoleBadge label="Donator" color={color} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => apply(e.target.value)}
          aria-label="Donator badge color"
          className="h-12 w-14 cursor-pointer border border-border bg-surface"
        />
        <input
          name="donatorBadgeColor"
          value={color}
          onChange={(e) => apply(e.target.value)}
          maxLength={7}
          spellCheck={false}
          className="h-12 w-32 border border-border bg-surface px-4 font-mono text-sm uppercase text-white outline-none transition-colors focus:border-zinc-600"
        />
        <button
          type="button"
          onClick={() => setColor(DEFAULT_DONATOR_BADGE_COLOR)}
          className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-category transition-colors hover:text-white"
        >
          Reset to green
        </button>
      </div>
    </div>
  );
}

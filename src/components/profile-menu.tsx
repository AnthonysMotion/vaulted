"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { SignOutButton } from "./sign-out-button";

const chip =
  "inline-flex h-8 items-center rounded-md px-4 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white";

export function ProfileMenu({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={`${chip} cursor-pointer gap-2`}
      >
        <span className="relative grid h-5 w-5 place-items-center overflow-hidden rounded border border-white/10 bg-white/5">
          <SafeImage
            src={avatarUrl}
            alt=""
            fill
            sizes="20px"
            className="object-cover"
            fallback={<span className="h-2.5 w-2.5 rounded-full bg-white" />}
          />
        </span>
        <span className="max-w-[100px] truncate">{username}</span>
        <span className="text-[10px] text-zinc-500">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 flex min-w-48 flex-col rounded-lg border border-white/10 bg-black/40 p-1 shadow-2xl backdrop-blur-xl"
        >
          <Link
            href="/dashboard"
            role="menuitem"
            className={`block ${chip}`}
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href={`/profile/${username}`}
            role="menuitem"
            className={`block ${chip}`}
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/account"
            role="menuitem"
            className={`block ${chip}`}
            onClick={() => setOpen(false)}
          >
            Edit account
          </Link>
          <SignOutButton
            className={`block w-full text-left ${chip}`}
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

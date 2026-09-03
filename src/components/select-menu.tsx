"use client";

import { useEffect, useId, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

export function SelectMenu({
  name,
  options,
  defaultValue = "",
  value: valueProp,
  onChange,
  emptyLabel,
  className = "",
}: {
  name?: string;
  options: SelectOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  emptyLabel?: string;
  className?: string;
}) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = valueProp ?? uncontrolled;

  const items =
    emptyLabel !== undefined
      ? [{ value: "", label: emptyLabel }, ...options]
      : options;
  const selected = items.find((item) => item.value === value) ?? items[0];

  function choose(next: string) {
    if (valueProp === undefined) setUncontrolled(next);
    onChange?.(next);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointer(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={`relative min-w-0 ${className}`.trim()}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 w-full items-center justify-between gap-3 border border-border bg-surface px-4 text-left text-white outline-none transition-colors hover:border-zinc-600 focus:border-zinc-600"
      >
        <span className="min-w-0 truncate text-sm font-medium tracking-[-0.02em]">
          {selected?.label ?? ""}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 10 6"
          className={`h-2 w-2.5 shrink-0 text-muted transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full min-w-full overflow-y-auto border border-border bg-surface py-1"
        >
          {items.map((item) => {
            const active = item.value === value;
            return (
              <li key={item.value || "__empty"} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => choose(item.value)}
                  className={`flex w-full px-4 py-2.5 text-left text-sm tracking-[-0.02em] transition-colors duration-150 ${
                    active
                      ? "bg-white/[0.06] text-white"
                      : "text-category hover:bg-[var(--color-blur)] hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

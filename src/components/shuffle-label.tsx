"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

type Glyph = {
  char: string;
  /** Accent blue while scrambling — matches Sui’s mid-shuffle tint. */
  accent: boolean;
};

/**
 * Sui-style scramble: ~40ms ticks, left-to-right resolve (~500ms),
 * with a random subset of live glyphs flashing brand blue.
 */
export function ShuffleLabel({
  text,
  trigger,
  className = "",
  /** Flash color for mid-scramble glyphs. Pass `false` to keep the inherited color. */
  accentColor = "var(--color-blur)",
  align = "center",
}: {
  text: string;
  trigger: number;
  className?: string;
  accentColor?: string | false;
  align?: "left" | "center";
}) {
  const [glyphs, setGlyphs] = useState<Glyph[]>(() =>
    text.split("").map((char) => ({ char, accent: false })),
  );
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined);
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    setGlyphs(text.split("").map((char) => ({ char, accent: false })));
  }, [text]);

  useLayoutEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const previousWidth = el.style.width;
    el.style.width = "auto";
    setMinWidth(el.getBoundingClientRect().width);
    el.style.width = previousWidth;
  }, [text, className, glyphs.length]);

  useEffect(() => {
    if (trigger === 0) return;
    if (reducedMotion.current) {
      setGlyphs(text.split("").map((char) => ({ char, accent: false })));
      return;
    }

    if (intervalRef.current) clearInterval(intervalRef.current);

    const length = text.length;
    let iteration = 0;
    const maxIterations = 12;

    // Kick off with a full blue flash on live glyphs (Sui paints non-idle chars).
    intervalRef.current = setInterval(() => {
      iteration += 1;
      const revealed = Math.floor((iteration / maxIterations) * length);

      const liveIndexes: number[] = [];
      for (let i = 0; i < length; i++) {
        if (text[i] !== " " && i >= revealed) liveIndexes.push(i);
      }

      const blueCount =
        liveIndexes.length === 0
          ? 0
          : liveIndexes.length === 1
            ? 1
            : Math.max(
                1,
                Math.round(Math.random() * (liveIndexes.length - 1)) + 1,
              );

      const blueSet = new Set(
        [...liveIndexes].sort(() => Math.random() - 0.5).slice(0, blueCount),
      );

      setGlyphs(
        text.split("").map((ch, i) => {
          if (ch === " ") return { char: " ", accent: false };
          if (i < revealed) return { char: text[i]!, accent: false };
          return {
            char: SCRAMBLE_CHARS[
              Math.floor(Math.random() * SCRAMBLE_CHARS.length)
            ]!,
            accent: blueSet.has(i),
          };
        }),
      );

      if (iteration >= maxIterations) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setGlyphs(text.split("").map((char) => ({ char, accent: false })));
      }
    }, 40);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [trigger, text]);

  return (
    <span
      ref={spanRef}
      className={`${
        align === "left"
          ? "inline-block overflow-hidden whitespace-nowrap text-left"
          : "inline-block overflow-hidden whitespace-nowrap text-center"
      } ${className}`.trim()}
      style={{
        width: minWidth ? `${minWidth}px` : undefined,
        minWidth: minWidth ? `${minWidth}px` : undefined,
        fontKerning: "none",
        fontVariantLigatures: "none",
      }}
    >
        {glyphs.map((g, i) => (
          <span
            key={`${text}-${i}`}
            style={g.accent && accentColor ? { color: accentColor } : undefined}
          >
            {g.char === " " ? "\u00a0" : g.char}
          </span>
        ))}
    </span>
  );
}

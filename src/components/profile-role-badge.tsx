"use client";

import { ShinyText } from "@/components/shiny-text";

function resolveHex(color: string): string {
  const value = color.trim();
  if (value.startsWith("#")) return value;
  if (value.includes("--color-blur") || value.includes("--color-accent")) {
    return "#298dff";
  }
  return "#298dff";
}

export function ProfileRoleBadge({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  const hex = resolveHex(color);

  return (
    <span
      className="inline-flex items-center justify-center border px-3 py-1"
      style={{
        borderColor: `color-mix(in srgb, ${hex} 40%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${hex} 12%, transparent)`,
      }}
    >
      <ShinyText
        text={label}
        color={hex}
        shineColor="#ffffff"
        speed={2.4}
        delay={0.4}
        className="font-mono text-xs uppercase leading-none tracking-[-0.01em]"
      />
    </span>
  );
}

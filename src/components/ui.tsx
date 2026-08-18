"use client";

import Link from "next/link";
import {
  Children,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { ShuffleLabel } from "@/components/shuffle-label";

const baseBtn =
  "inline-flex h-10 items-center justify-center gap-2 px-4 text-sm font-medium tracking-[-0.01em] transition-opacity focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

const variants = {
  primary: "bg-accent text-white hover:opacity-90",
  dark: "bg-surface text-white border border-border hover:bg-surface-2",
  secondary:
    "bg-background text-white border border-border hover:border-muted",
  ghost: "bg-transparent text-muted hover:text-white hover:bg-surface",
  danger:
    "bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600/20",
  glass: "glass text-white hover:bg-white/10",
} as const;

function scrambleChildren(
  children: ReactNode,
  trigger: number,
  accentColor?: string,
) {
  return Children.map(children, (child) => {
    if (typeof child === "string" && child.trim().length > 0) {
      return (
        <ShuffleLabel
          key={`scramble-${child}`}
          text={child}
          trigger={trigger}
          accentColor={accentColor}
          className="font-medium tracking-[-0.01em]"
        />
      );
    }
    return child;
  });
}

export function Button({
  variant = "primary",
  className = "",
  children,
  onMouseEnter,
  ...props
}: ComponentProps<"button"> & {
  variant?: keyof typeof variants;
}) {
  const [trigger, setTrigger] = useState(0);

  return (
    <button
      className={`${baseBtn} ${variants[variant]} ${className}`}
      onMouseEnter={(e) => {
        setTrigger((n) => n + 1);
        onMouseEnter?.(e);
      }}
      {...props}
    >
      {scrambleChildren(
        children,
        trigger,
        variant === "primary" ? "var(--color-black)" : undefined,
      )}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  className = "",
  children,
  onMouseEnter,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: Exclude<keyof typeof variants, "danger">;
}) {
  const [trigger, setTrigger] = useState(0);

  return (
    <Link
      className={`${baseBtn} ${variants[variant]} ${className}`}
      onMouseEnter={(e) => {
        setTrigger((n) => n + 1);
        onMouseEnter?.(e);
      }}
      {...props}
    >
      {scrambleChildren(
        children,
        trigger,
        variant === "primary" ? "var(--color-black)" : undefined,
      )}
    </Link>
  );
}

export function Card({
  className = "",
  children,
  variant = "surface",
}: {
  className?: string;
  children: ReactNode;
  variant?: "glass" | "surface" | "tint";
}) {
  const styles = {
    glass: "glass",
    surface: "bg-surface border border-border",
    tint: "bg-surface-2 border border-border",
  };
  return (
    <div className={`p-5 sm:p-6 ${styles[variant]} ${className}`}>{children}</div>
  );
}

export function Badge({
  children,
  color = "default",
}: {
  children: ReactNode;
  color?: "default" | "gold" | "purple" | "pink" | "blue" | "green";
}) {
  const colors = {
    default: "bg-surface text-muted border-border",
    gold: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    purple: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    pink: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    blue: "bg-accent/10 text-accent border-accent/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[0.625rem] font-normal uppercase tracking-[-0.01em] ${colors[color]}`}
    >
      {children}
    </span>
  );
}

export { rarityBadgeColor } from "@/lib/packs/rarity";

export function ProgressBar({
  value,
  max,
  className = "",
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`h-1 w-full overflow-hidden bg-surface ${className}`}>
      <div
        className="h-full bg-accent transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon = "—",
  title,
  children,
}: {
  icon?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border bg-surface/50 py-16 text-center">
      <div className="mb-4 text-3xl text-muted-2">{icon}</div>
      <div className="mb-2 text-lg font-medium text-white">{title}</div>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="keep-round h-5 w-5 animate-spin border-2 border-white/10 border-t-accent" />
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6">
      <span className="font-mono text-[0.625rem] font-normal uppercase tracking-[-0.01em] text-category">
        {children}
      </span>
    </div>
  );
}

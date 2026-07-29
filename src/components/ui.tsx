import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const variants = {
    primary:
      "bg-primary text-slate-900 hover:bg-yellow-300 font-semibold shadow-[0_0_20px_rgba(250,204,21,0.25)]",
    secondary:
      "bg-surface-2 text-foreground border border-border hover:border-primary/50",
    ghost: "text-muted hover:text-foreground hover:bg-surface-2",
    danger: "bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" | "ghost" }) {
  const variants = {
    primary:
      "bg-primary text-slate-900 hover:bg-yellow-300 font-semibold shadow-[0_0_20px_rgba(250,204,21,0.25)]",
    secondary:
      "bg-surface-2 text-foreground border border-border hover:border-primary/50",
    ghost: "text-muted hover:text-foreground hover:bg-surface-2",
  };
  return (
    <Link
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm transition-all ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 ${className}`}>
      {children}
    </div>
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
    default: "bg-surface-2 text-muted border-border",
    gold: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
    purple: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    pink: "bg-pink-500/10 text-pink-300 border-pink-500/30",
    blue: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}
    >
      {children}
    </span>
  );
}

export function rarityBadgeColor(tier: number) {
  if (tier >= 6) return "pink" as const;
  if (tier >= 5) return "gold" as const;
  if (tier >= 4) return "purple" as const;
  if (tier >= 3) return "blue" as const;
  return "default" as const;
}

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
    <div className={`h-2 w-full overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-amber-400 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 flex items-center gap-2 text-2xl font-bold">
        {icon && <span>{icon}</span>}
        <span>{value}</span>
      </div>
    </div>
  );
}

export function EmptyState({
  icon = "🕳️",
  title,
  children,
}: {
  icon?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
      <div className="text-4xl">{icon}</div>
      <div className="mt-3 text-lg font-semibold">{title}</div>
      {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
  );
}

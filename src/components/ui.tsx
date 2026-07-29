import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const baseBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark" | "glass";
}) {
  const variants = {
    primary: "bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.1)]",
    dark: "bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800",
    secondary: "bg-black text-white border border-zinc-800 hover:border-zinc-700",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900",
    danger: "bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600/20",
    glass: "glass text-white hover:bg-white/10",
  };
  return (
    <button className={`${baseBtn} ${variants[variant]} ${className}`} {...props} />
  );
}

export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost" | "dark" | "glass";
}) {
  const variants = {
    primary: "bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.1)]",
    dark: "bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800",
    secondary: "bg-black text-white border border-zinc-800 hover:border-zinc-700",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900",
    glass: "glass text-white hover:bg-white/10",
  };
  return (
    <Link className={`${baseBtn} ${variants[variant]} ${className}`} {...props} />
  );
}

export function Card({
  className = "",
  children,
  variant = "glass",
}: {
  className?: string;
  children: ReactNode;
  variant?: "glass" | "surface";
}) {
  const variants = {
    glass: "glass",
    surface: "bg-zinc-950 border border-zinc-800",
  };
  return (
    <div
      className={`rounded-xl p-5 sm:p-6 ${variants[variant]} ${className}`}
    >
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
    default: "bg-zinc-900 text-zinc-400 border-zinc-800",
    gold: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    purple: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    pink: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <span
      className={`text-[10px] font-bold tracking-wider uppercase inline-flex items-center rounded-full border px-2 py-0.5 ${colors[color]}`}
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
    <div className={`h-1 w-full overflow-hidden rounded-full bg-zinc-900 ${className}`}>
      <div
        className="h-full rounded-full bg-white transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
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
    <div className="rounded-xl border border-zinc-800 bg-black p-5 hover:border-zinc-700 transition-colors">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">{label}</div>
      <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
        {icon && <span className="text-xl">{icon}</span>}
        <span>{value}</span>
      </div>
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 py-16 text-center">
      <div className="text-3xl text-zinc-600 mb-4">{icon}</div>
      <div className="text-lg font-bold text-white mb-2">{title}</div>
      {children && <div className="max-w-sm text-sm text-zinc-500">{children}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-white" />
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-6">
      <div className="h-px w-8 bg-zinc-800" />
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
        {children}
      </span>
    </div>
  );
}

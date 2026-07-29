import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const baseBtn =
  "inline-flex h-[50px] items-center justify-center gap-2 rounded-full px-6 mwg-label transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
}) {
  const variants = {
    primary: "bg-primary text-ink hover:brightness-95",
    dark: "bg-anthracite text-white hover:bg-dark-grey",
    secondary: "bg-surface text-foreground border border-border hover:bg-white",
    ghost: "bg-transparent text-muted hover:text-foreground hover:bg-surface",
    danger: "bg-[#fc4c3b]/10 text-[#fc4c3b] border border-[#fc4c3b]/30 hover:bg-[#fc4c3b]/15",
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
  variant?: "primary" | "secondary" | "ghost" | "dark";
}) {
  const variants = {
    primary: "bg-primary text-ink hover:brightness-95",
    dark: "bg-anthracite text-white hover:bg-dark-grey",
    secondary: "bg-surface text-foreground border border-border hover:bg-white",
    ghost: "bg-transparent text-muted hover:text-foreground hover:bg-surface",
  };
  return (
    <Link className={`${baseBtn} ${variants[variant]} ${className}`} {...props} />
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
    <div
      className={`rounded-[20px] border border-border bg-surface p-5 sm:p-6 ${className}`}
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
    default: "bg-surface-2 text-muted border-border",
    gold: "bg-primary/40 text-ink border-primary/60",
    purple: "bg-[#1975ff]/10 text-[#1975ff] border-[#1975ff]/25",
    pink: "bg-[#fc4c3b]/10 text-[#fc4c3b] border-[#fc4c3b]/25",
    blue: "bg-[#bcefff]/50 text-[#1266d4] border-[#bcefff]",
    green: "bg-accent/15 text-[#0f9a52] border-accent/30",
  };
  return (
    <span
      className={`mwg-label-s inline-flex items-center rounded-full border px-2.5 py-1 ${colors[color]}`}
    >
      {children}
    </span>
  );
}

export function rarityBadgeColor(tier: number) {
  if (tier >= 6) return "pink" as const;
  if (tier >= 5) return "gold" as const;
  if (tier >= 4) return "green" as const;
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
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
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
    <div className="rounded-[20px] border border-border bg-surface p-5">
      <div className="mwg-label-s text-muted">{label}</div>
      <div className="mt-2 flex items-center gap-2 text-3xl font-bold tracking-tight">
        {icon && <span className="text-2xl">{icon}</span>}
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
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-surface py-16 text-center">
      <div className="text-3xl text-muted">{icon}</div>
      <div className="mt-3 title-s">{title}</div>
      {children && <div className="mt-2 max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-anthracite" />
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="mwg-label text-muted">{children}</p>;
}

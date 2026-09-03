"use client";

import { useRef, useState } from "react";
import { DAILY_PACK_LIMIT } from "@/lib/game/constants";

export type ActivityDay = { date: string; count: number };

function formatDayLabel(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function packsLabel(count: number): string {
  if (count <= 0) return "No packs opened";
  return `${count} pack${count === 1 ? "" : "s"} opened`;
}

function cellColor(count: number): string {
  if (count <= 0) return "var(--color-black)";
  const level = Math.min(count, DAILY_PACK_LIMIT);
  const pct = Math.round(18 + (level / DAILY_PACK_LIMIT) * 82);
  return `color-mix(in srgb, var(--color-blur) ${pct}%, var(--color-black))`;
}

export function ActivityHeatmap({ days }: { days: ActivityDay[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{
    day: ActivityDay;
    x: number;
    y: number;
  } | null>(null);

  if (days.length === 0) return null;

  const weeks: (ActivityDay | undefined)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    const week: (ActivityDay | undefined)[] = days.slice(i, i + 7);
    while (week.length < 7) week.push(undefined);
    weeks.push(week);
  }

  const activeDays = days.filter((d) => Number(d.count) > 0).length;
  const totalPacks = days.reduce((sum, d) => sum + (Number(d.count) || 0), 0);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseLeave={() => setHover(null)}
    >
      <div
        className="grid grid-flow-col grid-rows-7 gap-1"
        style={{
          gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
        }}
      >
        {weeks.flatMap((week, wi) =>
          week.map((day, di) => {
            if (!day) {
              return <div key={`${wi}-${di}`} className="aspect-square" />;
            }

            const count = Number(day.count) || 0;
            return (
              <div
                key={day.date}
                role="img"
                aria-label={`${formatDayLabel(day.date)}: ${packsLabel(count)}`}
                className="aspect-square cursor-default transition-opacity duration-150 hover:opacity-80"
                style={{ backgroundColor: cellColor(count) }}
                onMouseEnter={(event) => {
                  const wrap = wrapRef.current;
                  if (!wrap) return;
                  const wr = wrap.getBoundingClientRect();
                  const cr = event.currentTarget.getBoundingClientRect();
                  const x = Math.min(
                    Math.max(cr.left - wr.left + cr.width / 2, 84),
                    wr.width - 84,
                  );
                  setHover({
                    day: { date: day.date, count },
                    x,
                    y: cr.top - wr.top,
                  });
                }}
              />
            );
          }),
        )}
      </div>

      <p className="mt-4 font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted">
        <span className="text-category">{totalPacks}</span> packs
        <span className="text-border"> / </span>
        <span className="text-category">{activeDays}</span> days
      </p>

      {hover ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 w-max max-w-[14rem] -translate-x-1/2 -translate-y-[calc(100%+10px)] border border-border bg-background px-3 py-2"
          style={{ left: hover.x, top: hover.y }}
        >
          <p className="font-mono text-[0.625rem] uppercase tracking-[-0.01em] text-muted">
            {formatDayLabel(hover.day.date)}
          </p>
          <p className="mt-1 text-sm font-medium tracking-[-0.02em] text-white">
            {packsLabel(hover.day.count)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

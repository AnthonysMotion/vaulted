const LEVEL_CLASS = [
  "bg-zinc-900",
  "bg-zinc-700",
  "bg-zinc-500",
  "bg-zinc-300",
  "bg-white",
] as const;

function levelForCount(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function formatDayLabel(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const LABEL_WIDTH = 28;

export function ActivityHeatmap({
  days,
}: {
  days: { date: string; count: number }[];
}) {
  if (days.length === 0) return null;

  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthLabels: { weekIndex: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const first = week[0];
    if (!first) return;
    const month = new Date(`${first.date}T00:00:00.000Z`).getUTCMonth();
    if (month !== lastMonth) {
      // Skip label if this week is too close to the previous label
      const prev = monthLabels[monthLabels.length - 1];
      if (!prev || weekIndex - prev.weekIndex >= 2) {
        monthLabels.push({ weekIndex, label: MONTHS[month] });
      }
      lastMonth = month;
    }
  });

  const activeDays = days.filter((d) => d.count > 0).length;
  const totalPacks = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="w-full min-w-0">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          Opening activity
        </h2>
        <p className="text-xs text-zinc-500">
          <span className="font-medium text-zinc-300">{totalPacks}</span> packs
          across{" "}
          <span className="font-medium text-zinc-300">{activeDays}</span> days
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          className="relative"
          style={{
            width: LABEL_WIDTH + weeks.length * STEP - GAP,
            minWidth: "100%",
          }}
        >
          <div className="relative mb-1 h-3" style={{ marginLeft: LABEL_WIDTH }}>
            {monthLabels.map((m) => (
              <span
                key={`${m.label}-${m.weekIndex}`}
                className="absolute text-[9px] leading-none text-zinc-600"
                style={{ left: m.weekIndex * STEP }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex" style={{ gap: GAP }}>
            <div
              className="flex shrink-0 flex-col text-[9px] text-zinc-600"
              style={{ width: LABEL_WIDTH - GAP, gap: GAP }}
            >
              {["", "Mon", "", "Wed", "", "Fri", ""].map((label, i) => (
                <span
                  key={i}
                  className="flex items-center"
                  style={{ height: CELL }}
                >
                  {label}
                </span>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                {Array.from({ length: 7 }).map((_, di) => {
                  const day = week[di];
                  if (!day) {
                    return (
                      <div
                        key={di}
                        style={{ width: CELL, height: CELL }}
                        className="rounded-[2px]"
                      />
                    );
                  }
                  const level = levelForCount(day.count);
                  return (
                    <div
                      key={day.date}
                      title={`${formatDayLabel(day.date)}: ${day.count} pack${day.count === 1 ? "" : "s"}`}
                      style={{ width: CELL, height: CELL }}
                      className={`rounded-[2px] ${LEVEL_CLASS[level]}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-zinc-600">
        <span>Less</span>
        {LEVEL_CLASS.map((cls, i) => (
          <div
            key={i}
            style={{ width: CELL, height: CELL }}
            className={`rounded-[2px] ${cls}`}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

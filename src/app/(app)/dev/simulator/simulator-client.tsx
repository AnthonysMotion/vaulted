"use client";

import { useState } from "react";
import { Button, Card, Spinner } from "@/components/ui";

type RarityAccuracy = {
  rarity: string;
  observedPercent: number;
  observedOneIn: number;
  targetPercent: number;
  targetOneIn: number;
  deltaPp: number;
  relativeError: number;
  samplingSePp: number;
  withinNoise: boolean;
  grade: "excellent" | "good" | "fair" | "off";
};

type AccuracySummary = {
  meanRelativeError: number;
  withinNoiseShare: number;
  gradedCount: number;
  grade: "excellent" | "good" | "fair" | "off";
  rows: RarityAccuracy[];
};

type SimResponse = {
  set: { id: string; name: string };
  era: string;
  sourceNotes: string;
  result: {
    packs: number;
    godPacks: number;
    rarityPackRate: Record<string, { count: number; percent: number; oneIn: number }>;
    topCards: {
      cardId: string;
      name: string;
      rarity: string | null;
      count: number;
      percent: number;
    }[];
    totalCardsDrawn: number;
  };
  accuracy: AccuracySummary;
};

const GRADE_STYLES: Record<
  RarityAccuracy["grade"],
  { label: string; className: string }
> = {
  excellent: {
    label: "Excellent",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  good: {
    label: "Good",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  },
  fair: {
    label: "Fair",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  off: {
    label: "Off",
    className: "border-red-500/30 bg-red-500/10 text-red-300",
  },
};

function GradeBadge({ grade }: { grade: RarityAccuracy["grade"] }) {
  const style = GRADE_STYLES[grade];
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${style.className}`}
    >
      {style.label}
    </span>
  );
}

function formatOneIn(value: number) {
  if (!isFinite(value) || value <= 0) return "—";
  return value >= 100 ? value.toFixed(0) : value.toFixed(1);
}

export function SimulatorClient({
  sets,
}: {
  sets: { id: string; name: string; series: string }[];
}) {
  const [setId, setSetId] = useState("sv3pt5");
  const [packs, setPacks] = useState(100_000);
  const [running, setRunning] = useState(false);
  const [data, setData] = useState<SimResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/dev/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId, packs }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Simulation failed");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Set
          <select
            value={setId}
            onChange={(e) => setSetId(e.target.value)}
            className="max-w-60 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
          >
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.series})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Packs
          <input
            type="number"
            min={100}
            max={500000}
            value={packs}
            onChange={(e) => setPacks(Number(e.target.value))}
            className="w-32 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
          />
        </label>
        <Button onClick={run} disabled={running}>
          {running ? "Simulating..." : `Simulate ${packs.toLocaleString()} packs`}
        </Button>
      </Card>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {running && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {data && !running && (
        <>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-bold">
                  {data.set.name} — {data.result.packs.toLocaleString()} packs (
                  {data.era} era)
                </h2>
                <p className="mt-1 text-xs text-muted">{data.sourceNotes}</p>
              </div>
              <GradeBadge grade={data.accuracy.grade} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  Mean relative error
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-white">
                  {(data.accuracy.meanRelativeError * 100).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  Within sampling noise
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-white">
                  {(data.accuracy.withinNoiseShare * 100).toFixed(0)}%
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {data.accuracy.rows.filter((r) => r.withinNoise).length}/
                  {data.accuracy.gradedCount} rarities
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  Graded rarities
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-white">
                  {data.accuracy.gradedCount}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Target ≥ 0.05% of packs
                </p>
              </div>
            </div>

            {data.result.godPacks > 0 && (
              <p className="mt-4 text-sm text-yellow-300">
                {data.result.godPacks} god packs (1 in{" "}
                {Math.round(data.result.packs / data.result.godPacks).toLocaleString()}
                )
              </p>
            )}

            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              Targets are implied by slot weights in{" "}
              <code className="text-zinc-400">configs.ts</code> for this set&apos;s
              card pools. Relative error = |observed − target| / target. “Within
              noise” means the gap is inside ~2× the binomial sampling SE for this
              pack count.
            </p>
          </Card>

          <Card>
            <h2 className="font-bold">Observed vs target</h2>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted">
                  <th className="py-2">Rarity</th>
                  <th className="py-2 text-right">Observed</th>
                  <th className="py-2 text-right">Target</th>
                  <th className="py-2 text-right">Δ pp</th>
                  <th className="py-2 text-right">Rel. err</th>
                  <th className="py-2 text-right">1 in (obs / tgt)</th>
                  <th className="py-2 text-right">Grade</th>
                </tr>
              </thead>
              <tbody>
                {data.accuracy.rows.map((r) => (
                  <tr key={r.rarity} className="border-b border-border/50">
                    <td className="py-1.5">
                      <span className="font-medium text-white">{r.rarity}</span>
                      {r.withinNoise && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                          noise ok
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-right">
                      {r.observedPercent.toFixed(2)}%
                    </td>
                    <td className="py-1.5 text-right text-zinc-400">
                      {r.targetPercent.toFixed(2)}%
                    </td>
                    <td
                      className={`py-1.5 text-right ${
                        Math.abs(r.deltaPp) < 0.05
                          ? "text-zinc-400"
                          : r.deltaPp > 0
                            ? "text-emerald-400"
                            : "text-amber-400"
                      }`}
                    >
                      {r.deltaPp >= 0 ? "+" : ""}
                      {r.deltaPp.toFixed(2)}
                    </td>
                    <td className="py-1.5 text-right">
                      {(r.relativeError * 100).toFixed(1)}%
                    </td>
                    <td className="py-1.5 text-right text-zinc-400">
                      {formatOneIn(r.observedOneIn)} / {formatOneIn(r.targetOneIn)}
                    </td>
                    <td className="py-1.5 text-right">
                      <GradeBadge grade={r.grade} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <h2 className="font-bold">All observed rarity rates</h2>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted">
                  <th className="py-2">Rarity</th>
                  <th className="py-2 text-right">Packs with ≥1</th>
                  <th className="py-2 text-right">%</th>
                  <th className="py-2 text-right">1 in X</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.result.rarityPackRate).map(([rarity, r]) => (
                  <tr key={rarity} className="border-b border-border/50">
                    <td className="py-1.5">{rarity}</td>
                    <td className="py-1.5 text-right">{r.count.toLocaleString()}</td>
                    <td className="py-1.5 text-right">{r.percent.toFixed(2)}%</td>
                    <td className="py-1.5 text-right">
                      {r.oneIn === null || !isFinite(r.oneIn)
                        ? "—"
                        : r.oneIn.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <h2 className="font-bold">Chase card rates</h2>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted">
                  <th className="py-2">Card</th>
                  <th className="py-2">Rarity</th>
                  <th className="py-2 text-right">Pulls</th>
                  <th className="py-2 text-right">% of packs</th>
                </tr>
              </thead>
              <tbody>
                {data.result.topCards.slice(0, 25).map((c) => (
                  <tr key={c.cardId} className="border-b border-border/50">
                    <td className="py-1.5">{c.name}</td>
                    <td className="py-1.5 text-xs text-muted">{c.rarity}</td>
                    <td className="py-1.5 text-right">{c.count.toLocaleString()}</td>
                    <td className="py-1.5 text-right">{c.percent.toFixed(3)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

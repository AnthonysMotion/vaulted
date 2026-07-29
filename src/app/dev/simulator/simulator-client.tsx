"use client";

import { useState } from "react";
import { Button, Card, Spinner } from "@/components/ui";

type SimResponse = {
  set: { id: string; name: string };
  era: string;
  sourceNotes: string;
  result: {
    packs: number;
    godPacks: number;
    rarityPackRate: Record<string, { count: number; percent: number; oneIn: number }>;
    topCards: { cardId: string; name: string; rarity: string | null; count: number; percent: number }[];
    totalCardsDrawn: number;
  };
};

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
            <h2 className="font-bold">
              {data.set.name} — {data.result.packs.toLocaleString()} packs ({data.era} era)
            </h2>
            <p className="mt-1 text-xs text-muted">{data.sourceNotes}</p>
            {data.result.godPacks > 0 && (
              <p className="mt-2 text-sm text-yellow-300">
                ✨ {data.result.godPacks} god packs (1 in{" "}
                {Math.round(data.result.packs / data.result.godPacks).toLocaleString()})
              </p>
            )}
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
                      {r.oneIn === null || !isFinite(r.oneIn) ? "—" : r.oneIn.toFixed(1)}
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

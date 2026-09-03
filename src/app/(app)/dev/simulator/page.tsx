import { getAllSets } from "@/lib/game/queries";
import { SimulatorClient } from "./simulator-client";

export const metadata = { title: "Pull Rate Simulator" };
export const dynamic = "force-dynamic";

/**
 * Internal testing tool: simulate large volumes of packs and compare the
 * observed rarity rates against the researched targets in
 * `src/lib/packs/configs.ts` (runtime source of truth via packConfigForSet).
 */
export default async function SimulatorPage() {
  const sets = await getAllSets();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black">Pull rate simulator</h1>
      <p className="mt-1 text-muted">
        Internal testing tool. Open thousands of virtual packs and validate the
        engine against researched pull rates.
      </p>
      <div className="mt-6">
        <SimulatorClient sets={sets.map((s) => ({ id: s.id, name: s.name, series: s.series }))} />
      </div>
    </div>
  );
}

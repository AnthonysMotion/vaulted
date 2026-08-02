/**
 * Internal testing tool: simulate opening N packs of a set and compare the
 * observed rates against the researched targets.
 *
 * Usage: npm run simulate -- sv3pt5 100000
 */
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const [setId, countArg] = process.argv.slice(2);
  if (!setId) {
    console.error("Usage: npm run simulate -- <setId> [packCount]");
    process.exit(1);
  }
  const packCount = Number(countArg ?? 10000);

  const { db } = await import("../src/db");
  const { simulatePacks } = await import("../src/lib/packs/engine");
  const { packConfigForSet } = await import("../src/lib/packs/configs");
  const { companionSetIdsFor } = await import("../src/lib/packs/companions");
  const { eq, inArray } = await import("drizzle-orm");
  const schema = await import("../src/db/schema");

  const set = await db.query.sets.findFirst({ where: eq(schema.sets.id, setId) });
  if (!set) {
    console.error(`Set '${setId}' not found. Run npm run db:seed first.`);
    process.exit(1);
  }

  const packConfig = packConfigForSet(set.id, set.series);
  const companionIds = packConfig.companionSetIds ?? companionSetIdsFor(setId);
  const poolSetIds = [setId, ...companionIds];

  const setCards = await db.query.cards.findMany({
    where:
      poolSetIds.length === 1
        ? eq(schema.cards.setId, setId)
        : inArray(schema.cards.setId, poolSetIds),
  });

  console.log(`\nSimulating ${packCount.toLocaleString()} packs of ${set.name} (${set.id})`);
  console.log(`Era: ${packConfig.era} | Cards in pool: ${setCards.length}`);
  if (companionIds.length > 0) {
    console.log(`Companions: ${companionIds.join(", ")}`);
  }
  console.log(`Sources: ${packConfig.sourceNotes}\n`);
  console.log("Slots:");
  for (const slot of packConfig.slots) {
    const outcomes = slot.outcomes
      .map((o) => o.label ?? o.rarities.join("|"))
      .join(", ");
    console.log(`  ${slot.count}× ${slot.name} → ${outcomes}`);
  }
  console.log();

  const start = Date.now();
  const result = simulatePacks(setCards, packConfig, packCount);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`--- Rarity rates (packs containing ≥1) --- [${elapsed}s]`);
  for (const [rarity, r] of Object.entries(result.rarityPackRate)) {
    const oneIn = r.oneIn === Infinity ? "-" : `1 in ${r.oneIn.toFixed(1)}`;
    console.log(
      `${rarity.padEnd(28)} ${r.percent.toFixed(2).padStart(7)}%   ${oneIn}`,
    );
  }
  if (result.godPacks > 0) {
    console.log(`\nGod packs: ${result.godPacks} (1 in ${(packCount / result.godPacks).toFixed(0)})`);
  }

  console.log(`\nAvg cards/pack: ${(result.totalCardsDrawn / packCount).toFixed(2)}`);
  console.log(`\n--- Top chase cards ---`);
  for (const c of result.topCards.slice(0, 20)) {
    console.log(
      `${c.name.padEnd(32)} ${(c.rarity ?? "?").padEnd(28)} ${c.count
        .toString()
        .padStart(6)} pulls  (${c.percent.toFixed(3)}% of packs)`,
    );
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

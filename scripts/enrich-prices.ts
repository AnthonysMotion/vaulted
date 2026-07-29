/**
 * Optional: enrich cards with market pricing from the pokemontcg.io API.
 * Get a free API key at https://dev.pokemontcg.io and set POKEMONTCG_API_KEY.
 *
 * Usage: npm run db:prices           (all sets)
 *        npm run db:prices -- sv3pt5 (single set)
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const API = "https://api.pokemontcg.io/v2/cards";

type ApiCard = {
  id: string;
  tcgplayer?: { prices?: Record<string, { market?: number | null }> };
  cardmarket?: { prices?: { averageSellPrice?: number; trendPrice?: number } };
};

async function main() {
  const onlySet = process.argv[2];
  const { db } = await import("../src/db");
  const schema = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");

  const allSets = await db.query.sets.findMany();
  const targets = onlySet ? allSets.filter((s) => s.id === onlySet) : allSets;
  const headers: Record<string, string> = {};
  if (process.env.POKEMONTCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMONTCG_API_KEY;
  }

  for (const set of targets) {
    console.log(`Pricing ${set.id} (${set.name})...`);
    let page = 1;
    for (;;) {
      const res = await fetch(
        `${API}?q=set.id:${set.id}&select=id,tcgplayer,cardmarket&page=${page}&pageSize=250`,
        { headers },
      );
      if (!res.ok) {
        console.warn(`  API ${res.status} for ${set.id} page ${page}, skipping set`);
        break;
      }
      const body = (await res.json()) as { data: ApiCard[]; count: number };
      for (const card of body.data) {
        const tcg: Record<string, number | null> = {};
        for (const [variant, p] of Object.entries(card.tcgplayer?.prices ?? {})) {
          tcg[variant] = p.market ?? null;
        }
        await db
          .update(schema.cards)
          .set({
            prices: {
              tcgplayer: tcg,
              cardmarket: {
                averageSellPrice: card.cardmarket?.prices?.averageSellPrice ?? null,
                trendPrice: card.cardmarket?.prices?.trendPrice ?? null,
              },
              updatedAt: new Date().toISOString(),
            },
          })
          .where(eq(schema.cards.id, card.id));
      }
      if (body.count < 250) break;
      page++;
    }
  }
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

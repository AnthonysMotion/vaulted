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
/** Nested tcgplayer + cardmarket payloads 500/502 the API at 250. */
const PAGE_SIZE = 50;
const MAX_ATTEMPTS = 4;

type ApiCard = {
  id: string;
  tcgplayer?: { prices?: Record<string, { market?: number | null }> };
  cardmarket?: { prices?: { averageSellPrice?: number; trendPrice?: number } };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(
  setId: string,
  page: number,
  headers: Record<string, string>,
): Promise<{ data: ApiCard[]; count: number } | { status: number; body: string }> {
  const url = `${API}?q=set.id:${encodeURIComponent(setId)}&select=id,tcgplayer,cardmarket&page=${page}&pageSize=${PAGE_SIZE}`;
  let lastStatus = 0;
  let lastBody = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url, { headers });
    lastStatus = res.status;
    lastBody = await res.text();
    if (res.ok) {
      return JSON.parse(lastBody) as { data: ApiCard[]; count: number };
    }
    const retryable = res.status >= 500 || res.status === 429;
    if (!retryable || attempt === MAX_ATTEMPTS) break;
    await sleep(attempt * 1500);
  }

  return { status: lastStatus, body: lastBody.slice(0, 200) };
}

async function main() {
  const onlySet = process.argv[2];
  const { db, closeDb } = await import("../src/db");
  const schema = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");

  const allSets = await db.query.sets.findMany();
  const targets = onlySet ? allSets.filter((s) => s.id === onlySet) : allSets;
  if (onlySet && targets.length === 0) {
    console.error(`Set '${onlySet}' not found. Run npm run db:seed first.`);
    await closeDb();
    process.exitCode = 1;
    return;
  }

  const headers: Record<string, string> = {};
  if (process.env.POKEMONTCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMONTCG_API_KEY;
  } else {
    console.warn("POKEMONTCG_API_KEY is unset. Using the unauthenticated quota.");
  }

  for (const set of targets) {
    console.log(`Pricing ${set.id} (${set.name})...`);
    let page = 1;
    let updated = 0;
    for (;;) {
      const result = await fetchPage(set.id, page, headers);
      if ("status" in result) {
        console.warn(
          `  API ${result.status} for ${set.id} page ${page} after ${MAX_ATTEMPTS} tries. ${result.body}`,
        );
        break;
      }
      for (const card of result.data) {
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
        updated++;
      }
      console.log(`  page ${page}: ${result.data.length} cards`);
      if (result.count < PAGE_SIZE) break;
      page++;
    }
    console.log(`  updated ${updated} cards`);
  }

  console.log("Done.");
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  try {
    const { closeDb } = await import("../src/db");
    await closeDb();
  } catch {
    // ignore
  }
  process.exitCode = 1;
});

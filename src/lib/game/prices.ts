import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { cards, type CardPrices } from "@/db/schema";
import { PRICE_CACHE_TTL_MS } from "@/lib/game/constants";
import type { PriceSnapshot } from "@/lib/game/card-price";
import { isFallbackEnergyId } from "@/lib/packs/basic-energy";

const API = "https://api.pokemontcg.io/v2/cards";
const MAX_IDS = 24;
const FETCH_CONCURRENCY = 4;
const FETCH_ATTEMPTS = 3;

type ApiCard = {
  id: string;
  tcgplayer?: { prices?: Record<string, { market?: number | null }> };
  cardmarket?: { prices?: { averageSellPrice?: number | null; trendPrice?: number | null } };
};

export function isPriceFresh(prices: PriceSnapshot | null | undefined): boolean {
  if (!prices?.updatedAt) return false;
  const stamped = Date.parse(prices.updatedAt);
  return Number.isFinite(stamped) && Date.now() - stamped < PRICE_CACHE_TTL_MS;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function snapshotFromApi(card: ApiCard): CardPrices {
  const tcg: Record<string, number | null> = {};
  for (const [variant, row] of Object.entries(card.tcgplayer?.prices ?? {})) {
    tcg[variant] = row.market ?? null;
  }
  return {
    tcgplayer: tcg,
    cardmarket: {
      averageSellPrice: card.cardmarket?.prices?.averageSellPrice ?? null,
      trendPrice: card.cardmarket?.prices?.trendPrice ?? null,
    },
    updatedAt: new Date().toISOString(),
  };
}

async function fetchCardPricesFromApi(id: string): Promise<CardPrices | null> {
  const headers: Record<string, string> = {};
  if (process.env.POKEMONTCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMONTCG_API_KEY;
  }

  const url = `${API}/${encodeURIComponent(id)}?select=id,tcgplayer,cardmarket`;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (res.ok) {
      const body = (await res.json()) as { data?: ApiCard };
      if (!body.data) return null;
      return snapshotFromApi(body.data);
    }
    if (res.status === 404) return null;
    const retryable = res.status >= 500 || res.status === 429;
    if (!retryable || attempt === FETCH_ATTEMPTS) return null;
    await sleep(attempt * 400);
  }
  return null;
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = index++;
      out[current] = await worker(items[current]!);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
  return out;
}

async function loadPriceRows(ids: string[]) {
  const unique = [...new Set(ids.filter((id) => id && !isFallbackEnergyId(id)))].slice(
    0,
    MAX_IDS,
  );
  if (unique.length === 0) {
    return { unique, byId: new Map<string, CardPrices | null>() };
  }
  const rows = await db.query.cards.findMany({
    where: inArray(cards.id, unique),
    columns: { id: true, prices: true },
  });
  return {
    unique,
    byId: new Map(rows.map((row) => [row.id, row.prices ?? null])),
  };
}

/** Read cached `cards.prices` without calling the Pokémon TCG API. */
export async function readCardPrices(
  ids: string[],
): Promise<Map<string, CardPrices | null>> {
  const { unique, byId } = await loadPriceRows(ids);
  const result = new Map<string, CardPrices | null>();
  for (const id of unique) {
    result.set(id, byId.get(id) ?? null);
  }
  return result;
}

/**
 * Return cached prices, refreshing any card older than `PRICE_CACHE_TTL_MS`.
 * Failed API lookups keep the previous cache row.
 */
export async function ensureCardPrices(
  ids: string[],
): Promise<Map<string, CardPrices | null>> {
  const { unique, byId } = await loadPriceRows(ids);
  const result = new Map<string, CardPrices | null>();
  if (unique.length === 0) return result;

  const stale: string[] = [];
  for (const id of unique) {
    if (!byId.has(id)) {
      result.set(id, null);
      continue;
    }
    const current = byId.get(id) ?? null;
    result.set(id, current);
    if (!isPriceFresh(current)) stale.push(id);
  }

  if (stale.length === 0) return result;

  await mapPool(stale, FETCH_CONCURRENCY, async (id) => {
    const fresh = await fetchCardPricesFromApi(id);
    if (!fresh) return;
    await db.update(cards).set({ prices: fresh }).where(eq(cards.id, id));
    result.set(id, fresh);
  });

  return result;
}

import { NextResponse } from "next/server";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { cards, profiles, sets } from "@/db/schema";
import {
  MAX_SEARCH_LENGTH,
  MIN_SEARCH_LENGTH,
  type SearchResponse,
} from "@/lib/search";

const TRAINER_LIMIT = 5;
const SET_LIMIT = 5;
const CARD_LIMIT = 8;

/** Short in-process cache so repeat queries (typing back, reopen) feel instant. */
const CACHE_TTL_MS = 30_000;
const responseCache = new Map<string, { at: number; body: SearchResponse }>();

/** `%` and `_` are LIKE wildcards, so a raw query would match far too much. */
function likePattern(term: string) {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

/** Sort names that start with the query above names that merely contain it. */
function prefixFirst(column: AnyPgColumn, term: string) {
  const prefix = `${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
  return sql`case when lower(${column}) like ${prefix.toLowerCase()} then 0 else 1 end`;
}

/** Public cross-entity search behind the navbar search panel. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);

  if (q.length < MIN_SEARCH_LENGTH) {
    return NextResponse.json({ q, trainers: [], sets: [], cards: [] });
  }

  const cached = responseCache.get(q);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json(cached.body, {
      headers: { "Cache-Control": "private, max-age=15" },
    });
  }

  const pattern = likePattern(q);

  const [trainerRows, setRows, cardRows] = await Promise.all([
    db
      .select({
        username: profiles.username,
        avatarUrl: profiles.avatarUrl,
        level: profiles.level,
        totalCardsCollected: profiles.totalCardsCollected,
      })
      .from(profiles)
      .where(ilike(profiles.username, pattern))
      .orderBy(prefixFirst(profiles.username, q), desc(profiles.level))
      .limit(TRAINER_LIMIT),

    db
      .select({
        id: sets.id,
        name: sets.name,
        series: sets.series,
        releaseDate: sets.releaseDate,
        total: sets.total,
        logoUrl: sets.logoUrl,
        symbolUrl: sets.symbolUrl,
      })
      .from(sets)
      .where(
        or(
          ilike(sets.name, pattern),
          ilike(sets.series, pattern),
          ilike(sets.ptcgoCode, pattern),
        ),
      )
      .orderBy(prefixFirst(sets.name, q), desc(sets.releaseDate))
      .limit(SET_LIMIT),

    db
      .select({
        id: cards.id,
        name: cards.name,
        number: cards.number,
        rarity: cards.rarity,
        imageSmall: cards.imageSmall,
        setId: cards.setId,
        setName: sets.name,
      })
      .from(cards)
      .innerJoin(sets, eq(cards.setId, sets.id))
      .where(ilike(cards.name, pattern))
      .orderBy(prefixFirst(cards.name, q), desc(sets.releaseDate))
      .limit(CARD_LIMIT),
  ]);

  const body: SearchResponse = {
    q,
    trainers: trainerRows,
    sets: setRows,
    cards: cardRows,
  };

  responseCache.set(q, { at: Date.now(), body });
  // Bound memory if the process stays warm.
  if (responseCache.size > 200) {
    const oldest = responseCache.keys().next().value;
    if (oldest !== undefined) responseCache.delete(oldest);
  }

  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, max-age=15" },
  });
}

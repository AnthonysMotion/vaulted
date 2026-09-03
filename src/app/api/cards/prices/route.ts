import { NextResponse } from "next/server";
import { z } from "zod";
import { pickMarketPrice } from "@/lib/game/card-price";
import { ensureCardPrices } from "@/lib/game/prices";

const bodySchema = z.object({
  ids: z.array(z.string().min(1).max(80)).min(1).max(24),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const snapshots = await ensureCardPrices(parsed.data.ids);
    const prices: Record<
      string,
      {
        tcgplayer: Record<string, number | null>;
        market: number | null;
        reverseMarket: number | null;
        updatedAt: string | null;
      }
    > = {};

    for (const id of parsed.data.ids) {
      const snap = snapshots.get(id) ?? null;
      prices[id] = {
        tcgplayer: snap?.tcgplayer ?? {},
        market: pickMarketPrice(snap, false),
        reverseMarket: pickMarketPrice(snap, true),
        updatedAt: snap?.updatedAt ?? null,
      };
    }

    return NextResponse.json({ prices });
  } catch (err) {
    console.error("card prices failed", err);
    return NextResponse.json({ error: "Could not load prices" }, { status: 500 });
  }
}

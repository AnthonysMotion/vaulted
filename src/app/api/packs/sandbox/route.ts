import { NextResponse } from "next/server";
import { z } from "zod";
import { openSandboxPack, serialisePackWithCachedPrices } from "@/lib/game/open-pack";

const bodySchema = z.object({ setId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const body = bodySchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const pack = await openSandboxPack(body.data.setId);
    return NextResponse.json({ pack: await serialisePackWithCachedPrices(pack) });
  } catch (err) {
    console.error("sandbox open failed", err);
    return NextResponse.json({ error: "Could not open pack" }, { status: 500 });
  }
}

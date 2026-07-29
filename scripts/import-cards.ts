/**
 * Imports every set and card from the official community dataset
 * (github.com/PokemonTCG/pokemon-tcg-data) into the database, then seeds
 * pull-rate configs and achievements.
 *
 * Usage: npm run db:seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { sql } from "drizzle-orm";

const DATA_DIR = path.join(process.cwd(), ".data");
const TARBALL = path.join(DATA_DIR, "pokemon-tcg-data.tar.gz");
const EXTRACTED = path.join(DATA_DIR, "pokemon-tcg-data-master");
const TARBALL_URL =
  "https://github.com/PokemonTCG/pokemon-tcg-data/archive/refs/heads/master.tar.gz";

type RawSet = {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  ptcgoCode?: string;
  releaseDate: string;
  images: { symbol?: string; logo?: string };
};

type RawCard = {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  level?: string;
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  evolvesTo?: string[];
  rules?: string[];
  abilities?: { name: string; text: string; type: string }[];
  attacks?: {
    name: string;
    cost?: string[];
    convertedEnergyCost?: number;
    damage?: string;
    text?: string;
  }[];
  weaknesses?: { type: string; value: string }[];
  resistances?: { type: string; value: string }[];
  retreatCost?: string[];
  convertedRetreatCost?: number;
  number: string;
  rarity?: string;
  artist?: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  regulationMark?: string;
  images?: { small?: string; large?: string };
};

async function download() {
  try {
    await stat(EXTRACTED);
    console.log("Dataset already extracted, skipping download.");
    return;
  } catch {
    // not extracted yet
  }

  await mkdir(DATA_DIR, { recursive: true });
  console.log("Downloading pokemon-tcg-data (~40MB)...");
  const res = await fetch(TARBALL_URL, { redirect: "follow" });
  if (!res.ok || !res.body) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  await pipeline(
    Readable.fromWeb(res.body as import("node:stream/web").ReadableStream),
    createWriteStream(TARBALL),
  );
  console.log("Extracting...");
  execFileSync("tar", ["-xzf", TARBALL, "-C", DATA_DIR], { stdio: "inherit" });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  await download();

  // Imported lazily so DATABASE_URL is loaded from .env.local first.
  const { db } = await import("../src/db");
  const schema = await import("../src/db/schema");
  const { packConfigForSet } = await import("../src/lib/packs/configs");
  const { ACHIEVEMENT_DEFS } = await import("../src/lib/achievements");

  const setsJson: RawSet[] = JSON.parse(
    await readFile(path.join(EXTRACTED, "sets", "en.json"), "utf8"),
  );

  console.log(`Upserting ${setsJson.length} sets...`);
  for (const batch of chunk(setsJson, 100)) {
    await db
      .insert(schema.sets)
      .values(
        batch.map((s) => ({
          id: s.id,
          name: s.name,
          series: s.series,
          printedTotal: s.printedTotal,
          total: s.total,
          ptcgoCode: s.ptcgoCode ?? null,
          releaseDate: s.releaseDate.replaceAll("/", "-"),
          symbolUrl: s.images?.symbol ?? null,
          logoUrl: s.images?.logo ?? null,
        })),
      )
      .onConflictDoUpdate({
        target: schema.sets.id,
        set: {
          name: sql`excluded.name`,
          series: sql`excluded.series`,
          printedTotal: sql`excluded.printed_total`,
          total: sql`excluded.total`,
          releaseDate: sql`excluded.release_date`,
          symbolUrl: sql`excluded.symbol_url`,
          logoUrl: sql`excluded.logo_url`,
          updatedAt: sql`now()`,
        },
      });
  }

  const cardsDir = path.join(EXTRACTED, "cards", "en");
  const cardFiles = (await readdir(cardsDir)).filter((f) => f.endsWith(".json"));
  const setIds = new Set(setsJson.map((s) => s.id));

  let totalCards = 0;
  for (const file of cardFiles) {
    const setId = path.basename(file, ".json");
    if (!setIds.has(setId)) {
      console.warn(`Skipping ${file}: unknown set id`);
      continue;
    }
    const rawCards: RawCard[] = JSON.parse(
      await readFile(path.join(cardsDir, file), "utf8"),
    );
    if (rawCards.length === 0) continue;

    for (const batch of chunk(rawCards, 250)) {
      await db
        .insert(schema.cards)
        .values(
          batch.map((c) => ({
            id: c.id,
            setId,
            name: c.name,
            supertype: c.supertype ?? "Pokémon",
            subtypes: c.subtypes ?? [],
            level: c.level ?? null,
            hp: c.hp ?? null,
            types: c.types ?? [],
            evolvesFrom: c.evolvesFrom ?? null,
            evolvesTo: c.evolvesTo ?? [],
            rules: c.rules ?? [],
            abilities: c.abilities ?? [],
            attacks: c.attacks ?? [],
            weaknesses: c.weaknesses ?? [],
            resistances: c.resistances ?? [],
            retreatCost: c.retreatCost ?? [],
            convertedRetreatCost: c.convertedRetreatCost ?? null,
            number: c.number,
            rarity: c.rarity ?? null,
            artist: c.artist ?? null,
            flavorText: c.flavorText ?? null,
            nationalPokedexNumbers: c.nationalPokedexNumbers ?? [],
            regulationMark: c.regulationMark ?? null,
            imageSmall: c.images?.small ?? null,
            imageLarge: c.images?.large ?? null,
          })),
        )
        .onConflictDoUpdate({
          target: schema.cards.id,
          set: {
            name: sql`excluded.name`,
            rarity: sql`excluded.rarity`,
            imageSmall: sql`excluded.image_small`,
            imageLarge: sql`excluded.image_large`,
          },
        });
    }
    totalCards += rawCards.length;
    console.log(`  ${setId}: ${rawCards.length} cards`);
  }
  console.log(`Imported ${totalCards} cards across ${cardFiles.length} sets.`);

  console.log("Seeding pull-rate configs...");
  for (const s of setsJson) {
    const cfg = packConfigForSet(s.id, s.series);
    await db
      .insert(schema.setPullRates)
      .values({
        setId: s.id,
        era: cfg.era,
        config: cfg,
        sourceNotes: cfg.sourceNotes,
      })
      .onConflictDoUpdate({
        target: schema.setPullRates.setId,
        set: {
          era: sql`excluded.era`,
          config: sql`excluded.config`,
          sourceNotes: sql`excluded.source_notes`,
          lastUpdated: sql`now()`,
        },
      });
  }

  console.log("Seeding achievements...");
  await db
    .insert(schema.achievements)
    .values(ACHIEVEMENT_DEFS)
    .onConflictDoUpdate({
      target: schema.achievements.id,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        icon: sql`excluded.icon`,
        threshold: sql`excluded.threshold`,
        xpReward: sql`excluded.xp_reward`,
      },
    });

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

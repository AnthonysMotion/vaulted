# VaultedTCG

A social Pokémon TCG pack-opening simulator. Open booster packs with **researched real-world pull rates**, build a permanent collection, showcase a 3×3 binder, and compete with friends.

> Non-profit fan project. Pokémon and Pokémon TCG are trademarks of Nintendo, Creatures Inc. and GAME FREAK inc. Card data and images via the community [pokemon-tcg-data](https://github.com/PokemonTCG/pokemon-tcg-data) project.

## Stack

- **Next.js (App Router) + React + TypeScript**
- **Tailwind CSS v4** + **Framer Motion** for the pack-opening experience
- **Supabase** — auth (email/password) + PostgreSQL
- **Drizzle ORM** + drizzle-kit
- Deploys cleanly to **Vercel**

## Features

- **Sandbox Mode** — unlimited packs, no account, session history, nothing saved.
- **Trainer Mode** — 3 packs/day (UTC reset), permanent collection, streaks, XP, levels, achievements.
- **Realistic pull engine** — per-set slot structures and rarity weights sourced from community datasets (TCGplayer Infinite studies, Elite Fourum multi-thousand-pack samples, ThePriceDex models). Every era has its own booster configuration; sets can override (e.g. SV 151). God pack support included.
- **Collection** — filters by set/rarity/type, search, completion %, rarity distribution.
- **Binder** — public 3×3 showcase, drag-and-drop rearranging, only cards you own.
- **Social** — friend requests, collection comparison with missing-card lists, global activity feed with reactions (👍 🔥 🍀 💀).
- **Internal simulator** — `/dev/simulator` or the CLI to validate observed rates against researched targets.

## Setup

1. **Create a Supabase project** ([supabase.com](https://supabase.com)). In Authentication → Providers enable Email. Copy the API URL, anon key, and the database connection string.

2. **Configure env** — copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DATABASE_URL=postgresql://...
```

3. **Install & create schema**

```bash
npm install
npm run db:push        # creates all tables via drizzle-kit
```

4. **Import every card & set** (downloads ~40MB from pokemon-tcg-data, seeds sets, cards, pull-rate configs and achievements):

```bash
npm run db:seed
```

5. **Optional: market prices** (needs a free key from [dev.pokemontcg.io](https://dev.pokemontcg.io), set `POKEMONTCG_API_KEY`):

```bash
npm run db:prices              # all sets (slow)
npm run db:prices -- sv3pt5    # one set
```

6. **Run**

```bash
npm run dev
```

## Validating pull rates

Simulate 100,000 packs of Scarlet & Violet 151 and compare against the researched targets (IR 1:12, SIR 1:32, Hyper 1:51, ...):

```bash
npm run simulate -- sv3pt5 100000
```

Or use the in-app tool at `/dev/simulator`.

## Pull-rate data management

Every set's booster structure lives in the `set_pull_rates` table (slot rules, rarity weights, god pack config, source notes, last-updated). The engine is fully data-driven: adding a new expansion only requires a new row — no engine changes. Era defaults and set overrides are defined in `src/lib/packs/configs.ts` and seeded by `npm run db:seed`.

## Project layout

```
src/db/               Drizzle schema + client
src/lib/packs/        Pull engine, rarity model, researched configs
src/lib/game/         Profile, pack-opening game logic, queries
src/app/api/          Route handlers (packs, binder, friends, feed, simulate)
src/app/              Pages (landing, login, dashboard, open-pack, collection,
                      sets, profile, binder, friends, compare, feed, dev)
scripts/              Import, price enrichment, CLI simulator
```

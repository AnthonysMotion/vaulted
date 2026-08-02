# VaultedTCG

A social Pokémon TCG pack-opening simulator. Open booster packs with **researched real-world pull rates**, build a permanent collection, showcase a 3×3 binder, and compete with friends.

> Non-profit fan project. Pokémon and Pokémon TCG are trademarks of Nintendo, Creatures Inc. and GAME FREAK inc. Card data and images via the community [pokemon-tcg-data](https://github.com/PokemonTCG/pokemon-tcg-data) project.

## Stack

- **Next.js (App Router) + React + TypeScript**
- **Tailwind CSS v4** + **Framer Motion** for the pack-opening experience
- **Supabase** — auth (email/password, Google, Discord) + PostgreSQL
- **Drizzle ORM** + drizzle-kit
- Deploys cleanly to **Vercel**

## Features

- **Sandbox Mode** — unlimited packs, no account, session history, nothing saved.
- **Trainer Mode** — 3 packs/day (UTC reset), permanent collection, streaks, XP, levels, achievements.
- **Onboarding** — short walkthrough for new trainers (modes, daily limit, binder, profile).
- **Realistic pull engine** — per-set slot structures and rarity weights sourced from community datasets (TCGplayer Infinite studies, Elite Fourum multi-thousand-pack samples, ThePriceDex models). Every era has its own booster configuration; sets can override (e.g. SV 151). God pack support included.
- **Collection** — filters by set/rarity/type, search, completion %, rarity distribution.
- **Binder** — public 3×3 showcase, drag-and-drop rearranging, only cards you own.
- **Social** — friend requests, collection comparison with missing-card lists, global activity feed with reactions (👍 🔥 🍀 💀).
- **Internal simulator** — `/dev/simulator` or the CLI to validate observed rates against researched targets.

## Setup

1. **Create a Supabase project** ([supabase.com](https://supabase.com)). In Authentication → Providers enable **Email**, and optionally **Google** + **Discord**. Copy the API URL, anon key, and the database connection string.

   For OAuth: add `http://localhost:3000/auth/callback` (and your production URL) under Authentication → URL Configuration → Redirect URLs. Each provider also needs its own client ID/secret and the Supabase callback `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.

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

4. **Import every card & set** (downloads ~40MB from pokemon-tcg-data, seeds sets, cards, a pull-rate mirror table, and achievements):

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

## Pull-rate configuration

**Runtime source of truth:** `src/lib/packs/configs.ts`.

Pack opening (`open-pack`), the CLI simulator, and `/dev/simulator` all call `packConfigForSet()` from that file. Era defaults live in `ERA_BY_SERIES`; per-set differences live in `SET_OVERRIDES`. To change pull behaviour for a set, edit `configs.ts` — not the database.

The `set_pull_rates` table is a **seeded mirror** of those configs (written by `npm run db:seed` for inspection / notes). It is **not** read at runtime. If the table drifts from `configs.ts`, the code wins until you re-seed.

```
src/lib/packs/configs.ts   ← edit this to change pack odds
src/lib/packs/engine.ts    ← slot draw logic
set_pull_rates (DB)        ← mirror only; re-seed after config changes if you care about the table
```

## Project layout

```
src/db/               Drizzle schema + client
src/lib/packs/        Pull engine, rarity model, configs (runtime source of truth)
src/lib/game/         Profile, pack-opening game logic, onboarding, queries
src/lib/auth/         Client helpers (e.g. last-used OAuth method)
src/app/api/          Route handlers (packs, binder, friends, feed, simulate)
src/app/              Pages (landing, login, onboarding, dashboard, open-pack,
                      collection, sets, profile, binder, friends, compare, feed, dev)
src/app/auth/         OAuth callback
scripts/              Import, price enrichment, CLI simulator
```

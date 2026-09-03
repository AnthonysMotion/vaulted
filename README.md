# Vision

**The next pack could change everything.**

A free, social Pokémon TCG pack-opening simulator. Rip boosters with researched real-world slot odds, grow a permanent collection, flex a 3×3 binder, and chase god packs with friends.

```
  ┌─────────────────────────────────────────────────────────┐
  │  20k+ cards  ·  174 sets  ·  5 packs/day  ·  ∞ sandbox  │
  │              Coverage: Base Set (1999) → today          │
  └─────────────────────────────────────────────────────────┘
```

> Non-profit unofficial fan project. Pokémon and Pokémon TCG are trademarks of Nintendo, Creatures Inc., and GAME FREAK inc. Card data via [pokemon-tcg-data](https://github.com/PokemonTCG/pokemon-tcg-data); art via [images.pokemontcg.io](https://images.pokemontcg.io).

---

## Why Vision?

Most pack simulators are either pure RNG toys or paywalled gacha. Vision aims for the middle:

- **Era-correct boosters:** slot structures and rarity weights per set, not “random card from the whole set”
- **Two ways to play:** unlimited Sandbox for vibes, Trainer Mode for a real collection
- **Social by default:** binders, friends, compare, and a live pull feed
- **Transparent odds:** configs in code, validated with a built-in simulator

---

## Features

| Mode / area | What you get |
|---|---|
| **Sandbox** | Unlimited packs, no account, session history. Nothing is saved. |
| **Trainer** | 5 packs/day (UTC reset), permanent collection, XP, levels, streaks, achievements. |
| **Pull engine** | Per-set layouts, companion pools (TG / Shiny Vault / etc.), god packs, Basic Energy fallbacks. |
| **Collection** | Filter by set / rarity / type, search, completion %, rarity breakdown. |
| **Binder** | Public 3×3 showcase. Drag-and-drop, only cards you own. |
| **Social** | Friend requests, collection compare, activity feed with 👍 🔥 🍀 💀 reactions. |
| **Onboarding** | Short walkthrough: modes → daily limit → binder → profile. |
| **Images** | Optimized card art via `next/image` + CDN preloads so flips aren’t blank. |

### Pull-rate research

Weights and slot layouts are sourced from community datasets (TCGplayer Infinite studies, Elite Fourum multi-thousand-pack samples, ThePriceDex models, and set-specific overrides such as SV 151). Every era has its own booster configuration.

---

## Stack

| Layer | Choice |
|---|---|
| App | **Next.js 16** (App Router) · **React 19** · **TypeScript** |
| UI | **Tailwind CSS v4** · **Framer Motion** · **GSAP** |
| Auth + DB | **Supabase** (Email, Google, Discord) · **PostgreSQL** |
| ORM | **Drizzle ORM** + drizzle-kit |
| Images | **sharp** · Next Image Optimization · `images.pokemontcg.io` |
| Deploy | Vercel-friendly |

---

## Quick start

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers:** enable **Email**, and optionally **Google** + **Discord**.
3. **Authentication → URL Configuration:** add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - your production `https://…/auth/callback`
4. For each OAuth provider, set the provider callback to:
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`

### 2. Environment

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Use the Transaction pooler (port 6543), NOT session mode (5432).
DATABASE_URL=postgresql://postgres.YOUR-PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres

# Optional: market prices
# POKEMONTCG_API_KEY=...
```

### 3. Install, schema, seed

```bash
npm install
npm run db:push          # create tables
npm run db:seed          # ~40MB pokemon-tcg-data → sets, cards, achievements
npm run db:prices        # optional TCGPlayer/Cardmarket enrichment
npm run dev              # http://localhost:3000
```

Seed once; re-run after wiping the DB. Prices can be scoped:

```bash
npm run db:prices -- sv3pt5
```

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` / `start` | Production build & serve |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Drizzle schema to Postgres |
| `npm run db:generate` | Generate migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Import sets, cards, pull-rate mirror, achievements |
| `npm run db:prices` | Enrich market prices |
| `npm run simulate -- <setId> <n>` | CLI pull-rate validation |

Example: 100k packs of Scarlet & Violet 151:

```bash
npm run simulate -- sv3pt5 100000
```

Or open `/dev/simulator` (developer accounts only).

---

## Game loop

```
  Open pack ──► Slot engine (configs.ts)
       │
       ├─ Sandbox  → session history only
       │
       └─ Trainer  → user_cards + XP + streak + achievements + feed
                          │
                          ├─ Collection / set completion
                          ├─ Binder (3×3)
                          └─ Friends · Compare · Feed
```

| Mechanic | Detail |
|---|---|
| Daily limit | **5** Trainer packs per UTC day |
| XP | Base + rarity bonuses + streak (`min(streak, 30)`) + god-pack bonus |
| God packs | Rare whole-pack chase (e.g. SV 151 ≈ 1:2000) |
| Ultra-rare feed | Rarity tier ≥ 4 posts to the activity feed |
| Achievements | Packs, pulls, collection milestones, streaks, levels |

---

## Pull-rate configuration

**Runtime source of truth:** [`src/lib/packs/configs.ts`](src/lib/packs/configs.ts)

```
src/lib/packs/configs.ts   ← edit this to change pack odds
src/lib/packs/engine.ts    ← slot draw logic
src/lib/packs/companions.ts← TG / Shiny Vault / etc.
set_pull_rates (DB)        ← seeded mirror only, not read at runtime
```

- Era defaults live in `ERA_BY_SERIES`
- Per-set differences live in `SET_OVERRIDES`
- Pack open, CLI `simulate`, and `/dev/simulator` all call `packConfigForSet()`
- If the DB mirror drifts from `configs.ts`, **the code wins** until you re-seed

---

## App map

| Route | Purpose |
|---|---|
| `/` | Landing |
| `/open-pack` · `/open-pack/[setId]` | Pack picker & opener (`?mode=sandbox\|trainer`) |
| `/sets` · `/sets/[setId]` | Expansions & card galleries |
| `/collection` | Your binder pages of owned cards |
| `/binder/[username]` | Public 3×3 showcase |
| `/profile/[username]` | Trainer profile |
| `/compare/[username]` | Side-by-side collection gaps |
| `/friends` · `/feed` | Social graph & activity |
| `/achievements` · `/dashboard` · `/account` | Progress & settings |
| `/onboarding` | New trainer walkthrough |
| `/dev/simulator` | Internal odds lab |
| `/login` · `/auth/callback` | Auth |

**API:** `/api/packs/open`, `/api/packs/sandbox`, `/api/binder`, `/api/collection/cards`, `/api/friends`, `/api/feed/react`, `/api/profile/showcase-card`, `/api/dev/simulate`

---

## Project layout

```
vision/
├── scripts/                 # seed, prices, migrate, simulate
├── src/
│   ├── app/                 # App Router pages + API routes
│   │   ├── (app)/           # product surfaces
│   │   ├── api/             # route handlers
│   │   └── auth/callback/   # OAuth
│   ├── components/          # pack-opener, binder, feed, landing…
│   ├── db/                  # Drizzle schema + client
│   ├── lib/
│   │   ├── packs/           # engine, configs, rarity
│   │   ├── game/            # open-pack, XP, queries, onboarding
│   │   ├── images.ts        # CDN allowlist + art preload
│   │   └── supabase/        # browser + server clients
│   └── proxy.ts             # auth gate for protected routes
├── next.config.ts           # image remotePatterns, etc.
└── .env.example
```

---

## Contributing notes

- Prefer editing **`configs.ts`** over the database when tuning odds.
- After pack-config changes you care about mirroring, re-run `npm run db:seed` (or only refresh the rates mirror if you add a targeted script).
- Validate big odds changes with `npm run simulate -- <setId> 100000` before shipping.
- Card images are remote. Keep `images.pokemontcg.io` in `next.config.ts` `remotePatterns`.

---

## Disclaimer

Vision is a **non-commercial fan project**. It is not affiliated with, endorsed by, or associated with Nintendo, The Pokémon Company, Creatures Inc., or GAME FREAK. No real-money gambling. Pack opens are for fun and collection simulation only.

---

<p align="center">
  <strong>Rip a pack.</strong> The next one could change everything.
</p>

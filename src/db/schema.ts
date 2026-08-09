import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Card data (imported from pokemon-tcg-data)
// ---------------------------------------------------------------------------

export const sets = pgTable("sets", {
  /** TCG set id, e.g. "sv3pt5" */
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  series: text("series").notNull(),
  printedTotal: integer("printed_total").notNull(),
  total: integer("total").notNull(),
  ptcgoCode: text("ptcgo_code"),
  releaseDate: date("release_date").notNull(),
  symbolUrl: text("symbol_url"),
  logoUrl: text("logo_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type CardAttack = {
  name: string;
  cost?: string[];
  convertedEnergyCost?: number;
  damage?: string;
  text?: string;
};

export type CardAbility = { name: string; text: string; type: string };
export type CardTypeValue = { type: string; value: string };

export type CardPrices = {
  /** Market prices per variant from tcgplayer, e.g. { holofoil: 12.5 } */
  tcgplayer?: Record<string, number | null>;
  cardmarket?: { averageSellPrice?: number | null; trendPrice?: number | null };
  updatedAt?: string;
};

export const cards = pgTable(
  "cards",
  {
    /** TCG card id, e.g. "sv3pt5-199" */
    id: text("id").primaryKey(),
    setId: text("set_id")
      .notNull()
      .references(() => sets.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    supertype: text("supertype").notNull(),
    subtypes: jsonb("subtypes").$type<string[]>().default([]),
    level: text("level"),
    hp: text("hp"),
    types: jsonb("types").$type<string[]>().default([]),
    evolvesFrom: text("evolves_from"),
    evolvesTo: jsonb("evolves_to").$type<string[]>().default([]),
    rules: jsonb("rules").$type<string[]>().default([]),
    abilities: jsonb("abilities").$type<CardAbility[]>().default([]),
    attacks: jsonb("attacks").$type<CardAttack[]>().default([]),
    weaknesses: jsonb("weaknesses").$type<CardTypeValue[]>().default([]),
    resistances: jsonb("resistances").$type<CardTypeValue[]>().default([]),
    retreatCost: jsonb("retreat_cost").$type<string[]>().default([]),
    convertedRetreatCost: integer("converted_retreat_cost"),
    number: text("number").notNull(),
    rarity: text("rarity"),
    artist: text("artist"),
    flavorText: text("flavor_text"),
    nationalPokedexNumbers: jsonb("national_pokedex_numbers")
      .$type<number[]>()
      .default([]),
    regulationMark: text("regulation_mark"),
    imageSmall: text("image_small"),
    imageLarge: text("image_large"),
    prices: jsonb("prices").$type<CardPrices>(),
  },
  (t) => [
    index("cards_set_idx").on(t.setId),
    index("cards_rarity_idx").on(t.rarity),
    index("cards_name_idx").on(t.name),
  ],
);

// ---------------------------------------------------------------------------
// Pull-rate configuration (per set, data-driven pack engine)
// ---------------------------------------------------------------------------

export const setPullRates = pgTable("set_pull_rates", {
  setId: text("set_id")
    .primaryKey()
    .references(() => sets.id, { onDelete: "cascade" }),
  era: text("era").notNull(),
  /** Full PackConfig JSON consumed by the pull engine (see lib/packs/types) */
  config: jsonb("config").notNull(),
  sourceNotes: text("source_notes"),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

// ---------------------------------------------------------------------------
// Users / profiles
// ---------------------------------------------------------------------------

export const profiles = pgTable(
  "profiles",
  {
    /** Mirrors supabase auth.users id */
    id: uuid("id").primaryKey(),
    username: text("username").notNull(),
    avatarUrl: text("avatar_url"),
    bannerUrl: text("banner_url"),
    bio: text("bio"),
    favouritePokemon: text("favourite_pokemon"),
    favouriteCardId: text("favourite_card_id").references(() => cards.id),
    favouriteSetId: text("favourite_set_id").references(() => sets.id),
    xp: integer("xp").notNull().default(0),
    level: integer("level").notNull().default(1),
    totalPacksOpened: integer("total_packs_opened").notNull().default(0),
    /**
     * Lifetime collectible cards from trainer pack opens (copies, not uniques).
     * Excludes display-only fallback Basic Energy (`isFallbackEnergyId`) so the
     * counter matches what is persisted to `user_cards`. Drives collection
     * achievements such as cards-100 / cards-1000.
     */
    totalCardsCollected: integer("total_cards_collected").notNull().default(0),
    rarestPullCardId: text("rarest_pull_card_id").references(() => cards.id),
    rarestPullScore: integer("rarest_pull_score").notNull().default(0),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    /** UTC date of the most recent trainer-mode pack */
    lastPackDate: date("last_pack_date"),
    packsOpenedToday: integer("packs_opened_today").notNull().default(0),
    /**
     * Defaults true so existing trainers aren't forced through onboarding.
     * New profiles insert with false (see getOrCreateProfile).
     */
    onboardingCompleted: boolean("onboarding_completed").notNull().default(true),
    /** Site developer — can access /dev tools. */
    isDeveloper: boolean("is_developer").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("profiles_username_idx").on(t.username)],
);

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------

export const userCards = pgTable(
  "user_cards",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    firstObtainedAt: timestamp("first_obtained_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("user_cards_user_card_idx").on(t.userId, t.cardId),
    index("user_cards_user_idx").on(t.userId),
  ],
);

/** Per-user, per-set completion progress (denormalised for fast profiles) */
export const collections = pgTable(
  "collections",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    setId: text("set_id")
      .notNull()
      .references(() => sets.id, { onDelete: "cascade" }),
    uniqueOwned: integer("unique_owned").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("collections_user_set_idx").on(t.userId, t.setId)],
);

// ---------------------------------------------------------------------------
// Binder showcase
// ---------------------------------------------------------------------------

export const binders = pgTable(
  "binders",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Showcase"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex("binders_user_idx").on(t.userId)],
);

export const binderSlots = pgTable(
  "binder_slots",
  {
    id: serial("id").primaryKey(),
    binderId: integer("binder_id")
      .notNull()
      .references(() => binders.id, { onDelete: "cascade" }),
    /** 0-8 in the 3x3 grid */
    position: integer("position").notNull(),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    isFavourite: boolean("is_favourite").notNull().default(false),
  },
  (t) => [uniqueIndex("binder_slots_pos_idx").on(t.binderId, t.position)],
);

// ---------------------------------------------------------------------------
// Social
// ---------------------------------------------------------------------------

export const friendshipStatus = pgEnum("friendship_status", [
  "pending",
  "accepted",
]);

export const friendships = pgTable(
  "friendships",
  {
    id: serial("id").primaryKey(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    addresseeId: uuid("addressee_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: friendshipStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("friendships_pair_idx").on(t.requesterId, t.addresseeId),
    index("friendships_addressee_idx").on(t.addresseeId),
  ],
);

export const feedEventType = pgEnum("feed_event_type", [
  "rare_pull",
  "set_completed",
  "level_up",
  "streak_milestone",
  "achievement",
  "pack_dud",
]);

export type FeedPayload = {
  cardId?: string;
  cardName?: string;
  cardImage?: string;
  rarity?: string;
  setId?: string;
  setName?: string;
  level?: number;
  streak?: number;
  achievementId?: string;
  achievementName?: string;
  packCount?: number;
};

export const activityFeed = pgTable(
  "activity_feed",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: feedEventType("type").notNull(),
    payload: jsonb("payload").$type<FeedPayload>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("activity_feed_created_idx").on(t.createdAt)],
);

export const reactionType = pgEnum("reaction_type", [
  "like",
  "fire",
  "lucky",
  "rip",
]);

export const feedReactions = pgTable(
  "feed_reactions",
  {
    feedItemId: integer("feed_item_id")
      .notNull()
      .references(() => activityFeed.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    reaction: reactionType("reaction").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.feedItemId, t.userId, t.reaction] })],
);

// ---------------------------------------------------------------------------
// Pack openings & achievements
// ---------------------------------------------------------------------------

export type PulledCardRecord = {
  cardId: string;
  rarity: string | null;
  reverseHolo?: boolean;
};

export const packOpenings = pgTable(
  "pack_openings",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    setId: text("set_id")
      .notNull()
      .references(() => sets.id),
    cards: jsonb("cards").$type<PulledCardRecord[]>().notNull(),
    isGodPack: boolean("is_god_pack").notNull().default(false),
    xpAwarded: integer("xp_awarded").notNull().default(0),
    openedAt: timestamp("opened_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("pack_openings_user_idx").on(t.userId, t.openedAt)],
);

export const achievements = pgTable("achievements", {
  /** slug, e.g. "first-pack" */
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(),
  /** numeric goal used by generic progress checks (packs, streak days, ...) */
  threshold: integer("threshold").notNull().default(1),
  xpReward: integer("xp_reward").notNull().default(50),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.achievementId] })],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const setsRelations = relations(sets, ({ many, one }) => ({
  cards: many(cards),
  pullRates: one(setPullRates, {
    fields: [sets.id],
    references: [setPullRates.setId],
  }),
}));

export const cardsRelations = relations(cards, ({ one }) => ({
  set: one(sets, { fields: [cards.setId], references: [sets.id] }),
}));

export const profilesRelations = relations(profiles, ({ many, one }) => ({
  userCards: many(userCards),
  collections: many(collections),
  binder: one(binders, { fields: [profiles.id], references: [binders.userId] }),
  achievements: many(userAchievements),
  packOpenings: many(packOpenings),
  favouriteCard: one(cards, {
    fields: [profiles.favouriteCardId],
    references: [cards.id],
  }),
  rarestPull: one(cards, {
    fields: [profiles.rarestPullCardId],
    references: [cards.id],
  }),
}));

export const userCardsRelations = relations(userCards, ({ one }) => ({
  user: one(profiles, { fields: [userCards.userId], references: [profiles.id] }),
  card: one(cards, { fields: [userCards.cardId], references: [cards.id] }),
}));

export const bindersRelations = relations(binders, ({ one, many }) => ({
  user: one(profiles, { fields: [binders.userId], references: [profiles.id] }),
  slots: many(binderSlots),
}));

export const binderSlotsRelations = relations(binderSlots, ({ one }) => ({
  binder: one(binders, {
    fields: [binderSlots.binderId],
    references: [binders.id],
  }),
  card: one(cards, { fields: [binderSlots.cardId], references: [cards.id] }),
}));

export const activityFeedRelations = relations(
  activityFeed,
  ({ one, many }) => ({
    user: one(profiles, {
      fields: [activityFeed.userId],
      references: [profiles.id],
    }),
    reactions: many(feedReactions),
  }),
);

export const feedReactionsRelations = relations(feedReactions, ({ one }) => ({
  feedItem: one(activityFeed, {
    fields: [feedReactions.feedItemId],
    references: [activityFeed.id],
  }),
}));

export const packOpeningsRelations = relations(packOpenings, ({ one }) => ({
  user: one(profiles, {
    fields: [packOpenings.userId],
    references: [profiles.id],
  }),
  set: one(sets, { fields: [packOpenings.setId], references: [sets.id] }),
}));

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(profiles, {
      fields: [userAchievements.userId],
      references: [profiles.id],
    }),
    achievement: one(achievements, {
      fields: [userAchievements.achievementId],
      references: [achievements.id],
    }),
  }),
);

export const collectionsRelations = relations(collections, ({ one }) => ({
  user: one(profiles, {
    fields: [collections.userId],
    references: [profiles.id],
  }),
  set: one(sets, { fields: [collections.setId], references: [sets.id] }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(profiles, {
    fields: [friendships.requesterId],
    references: [profiles.id],
    relationName: "requester",
  }),
  addressee: one(profiles, {
    fields: [friendships.addresseeId],
    references: [profiles.id],
    relationName: "addressee",
  }),
}));

export type Set = typeof sets.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type UserCard = typeof userCards.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type ActivityFeedItem = typeof activityFeed.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type PackOpening = typeof packOpenings.$inferSelect;

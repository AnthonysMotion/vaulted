export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "packs" | "pulls" | "collection" | "streak" | "level";
  threshold: number;
  xpReward: number;
};

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // Packs
  { id: "first-pack", name: "First Pack Opened", description: "Open your first booster pack in Trainer Mode.", icon: "📦", category: "packs", threshold: 1, xpReward: 50 },
  { id: "packs-10", name: "Pack Rat", description: "Open 10 booster packs.", icon: "🎒", category: "packs", threshold: 10, xpReward: 100 },
  { id: "packs-100", name: "100 Packs Opened", description: "Open 100 booster packs.", icon: "🏅", category: "packs", threshold: 100, xpReward: 500 },
  { id: "packs-500", name: "Pack Addict", description: "Open 500 booster packs.", icon: "🎖️", category: "packs", threshold: 500, xpReward: 1500 },

  // Pulls
  { id: "first-ultra-rare", name: "Shiny!", description: "Pull your first Ultra Rare or better.", icon: "✨", category: "pulls", threshold: 1, xpReward: 100 },
  { id: "first-secret-rare", name: "Pulled First Secret Rare", description: "Pull your first Secret-tier card (SIR, Hyper Rare, Gold Star...).", icon: "🌈", category: "pulls", threshold: 1, xpReward: 250 },
  { id: "god-pack", name: "Chosen by Arceus", description: "Open a god pack.", icon: "🙏", category: "pulls", threshold: 1, xpReward: 1000 },

  // Collection
  { id: "cards-100", name: "Collector", description: "Collect 100 cards.", icon: "🃏", category: "collection", threshold: 100, xpReward: 200 },
  { id: "cards-1000", name: "Card Vault", description: "Collect 1,000 cards.", icon: "🏦", category: "collection", threshold: 1000, xpReward: 1000 },
  { id: "first-set-complete", name: "Completed First Set", description: "Complete every card in a set.", icon: "🏆", category: "collection", threshold: 1, xpReward: 2000 },

  // Streaks
  { id: "streak-7", name: "Week Streak", description: "Open packs 7 days in a row.", icon: "🔥", category: "streak", threshold: 7, xpReward: 150 },
  { id: "streak-30", name: "Monthly Devotion", description: "Open packs 30 days in a row.", icon: "🔥", category: "streak", threshold: 30, xpReward: 600 },
  { id: "streak-365", name: "365 Day Streak", description: "Open packs every day for a full year.", icon: "☀️", category: "streak", threshold: 365, xpReward: 10000 },

  // Level
  { id: "level-10", name: "Rising Trainer", description: "Reach trainer level 10.", icon: "⭐", category: "level", threshold: 10, xpReward: 200 },
  { id: "level-50", name: "Elite Trainer", description: "Reach trainer level 50.", icon: "🌟", category: "level", threshold: 50, xpReward: 2000 },
];

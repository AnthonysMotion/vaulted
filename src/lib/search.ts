/** Shared contract for `/api/search` and the navbar search panel. */

export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_LENGTH = 64;

export type TrainerResult = {
  username: string;
  avatarUrl: string | null;
  level: number;
  totalCardsCollected: number;
};

export type SetResult = {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  total: number;
  logoUrl: string | null;
  symbolUrl: string | null;
};

export type CardResult = {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  imageSmall: string | null;
  setId: string;
  setName: string;
};

export type SearchResponse = {
  q: string;
  trainers: TrainerResult[];
  sets: SetResult[];
  cards: CardResult[];
};

/** Card results deep-link into the set gallery and pop the lightbox. */
export function cardResultHref(card: CardResult) {
  return `/sets/${card.setId}?card=${encodeURIComponent(card.id)}`;
}

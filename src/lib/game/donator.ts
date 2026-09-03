/** Default Donator badge — emerald green. */
export const DEFAULT_DONATOR_BADGE_COLOR = "#22c55e";

/** Usernames granted donator on first profile create. */
export const BOOTSTRAP_DONATOR_USERNAMES = new Set(["anthonysmotion"]);

export function isBootstrapDonatorUsername(username: string): boolean {
  return BOOTSTRAP_DONATOR_USERNAMES.has(username.toLowerCase());
}

/** Returns a normalized `#rrggbb` or null if the value isn't a safe hex color. */
export function parseBadgeColor(raw: string | null | undefined): string | null {
  const value = raw?.trim() ?? "";
  if (!value) return null;
  const match = value.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return null;
  const hex = match[1];
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
  }
  return `#${hex}`.toLowerCase();
}

export function donatorBadgeColor(stored: string | null | undefined): string {
  return parseBadgeColor(stored) ?? DEFAULT_DONATOR_BADGE_COLOR;
}

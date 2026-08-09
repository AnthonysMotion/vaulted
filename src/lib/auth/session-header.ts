/** Set by `proxy.ts` after `getUser()`; stripped if a client tries to send it. */
export const VAULTED_USER_ID_HEADER = "x-vaulted-user-id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseVaultedUserId(
  value: string | null | undefined,
): string | null {
  if (!value || !UUID_RE.test(value)) return null;
  return value;
}

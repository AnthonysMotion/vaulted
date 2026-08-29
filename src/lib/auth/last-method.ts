/** Client-side only. Remembers which sign-in method this browser last used. */

export type AuthMethod = "google" | "discord" | "email";

const STORAGE_KEY = "vision:last-auth-method";

export function getLastAuthMethod(): AuthMethod | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "google" || value === "discord" || value === "email") {
      return value;
    }
  } catch {
    // private mode / blocked storage
  }
  return null;
}

export function setLastAuthMethod(method: AuthMethod) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, method);
  } catch {
    // ignore
  }
}

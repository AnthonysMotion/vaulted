const TRANSIENT_CODES = new Set([
  "CONNECT_TIMEOUT",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EPIPE",
  "ENOTFOUND",
  "EAI_AGAIN",
]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Walk nested `cause` chains from postgres.js / Drizzle failures. */
function collectErrorMessages(error: unknown): string[] {
  const messages: string[] = [];
  let current: unknown = error;
  const seen = new Set<unknown>();

  while (current && !seen.has(current)) {
    seen.add(current);
    if (current instanceof Error) {
      messages.push(current.message);
      const code = (current as Error & { code?: string }).code;
      if (code) messages.push(code);
      current = current.cause;
    } else if (typeof current === "object" && current !== null) {
      const obj = current as { message?: string; code?: string; cause?: unknown };
      if (obj.message) messages.push(obj.message);
      if (obj.code) messages.push(obj.code);
      current = obj.cause;
    } else {
      break;
    }
  }

  return messages;
}

/** True for pooler blips — worth retrying before surfacing a 500. */
export function isTransientDbError(error: unknown): boolean {
  const haystack = collectErrorMessages(error).join(" ").toLowerCase();

  for (const code of TRANSIENT_CODES) {
    if (haystack.includes(code.toLowerCase())) return true;
  }

  return (
    haystack.includes("connection terminated") ||
    haystack.includes("connection closed") ||
    haystack.includes("too many clients") ||
    haystack.includes("timeout")
  );
}

/** Retry a read when Supabase's transaction pooler drops the handshake. */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || i === attempts - 1) throw error;
      await sleep(250 * (i + 1));
    }
  }

  throw lastError;
}

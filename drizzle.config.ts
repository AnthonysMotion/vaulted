import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * drizzle-kit push/pull introspects CHECK constraints and breaks on the
 * Supabase transaction pooler (port 6543). Use a dedicated migrate URL, or
 * the same pooler host in session mode (5432). The app keeps DATABASE_URL on
 * 6543. See src/db/index.ts.
 */
function drizzleKitDatabaseUrl() {
  const explicit = process.env.DATABASE_URL_MIGRATE;
  if (explicit) return explicit;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  try {
    const parsed = new URL(url);
    if (parsed.port === "6543") parsed.port = "5432";
    return parsed.toString();
  } catch {
    return url;
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    url: drizzleKitDatabaseUrl(),
  },
});

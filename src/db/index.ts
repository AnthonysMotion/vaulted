import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Reuse one postgres.js client across Next.js HMR / route handlers.
 * Without this, every hot reload opens another pool and Supabase Session
 * mode quickly hits "max clients reached" (pool_size ≈ 15).
 *
 * Prefer DATABASE_URL on the Transaction pooler (port 6543). Session mode
 * (port 5432) is too tight for a Next.js app under concurrent requests.
 */
const globalForDb = globalThis as unknown as {
  __vaultedPg?: ReturnType<typeof postgres>;
};

function getClient() {
  if (globalForDb.__vaultedPg) return globalForDb.__vaultedPg;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString, {
    prepare: false, // required for Supabase transaction / pooler mode
    max: 1, // one socket per Node process — the pooler multiplexes above us
    idle_timeout: 20,
    max_lifetime: 60 * 5,
    connect_timeout: 10,
  });

  globalForDb.__vaultedPg = client;
  return client;
}

export const db = drizzle(getClient(), { schema });

export type Db = typeof db;

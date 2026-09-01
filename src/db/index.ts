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
  __visionPg?: ReturnType<typeof postgres>;
};

function getClient() {
  if (globalForDb.__visionPg) return globalForDb.__visionPg;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString, {
    prepare: false, // required for Supabase transaction / pooler mode
    // Allow a few concurrent queries per request (Promise.all). The Supabase
    // transaction pooler multiplexes above us — keep this modest on serverless.
    max: 8,
    idle_timeout: 20,
    max_lifetime: 60 * 5,
    connect_timeout: 20,
  });

  globalForDb.__visionPg = client;
  return client;
}

export const db = drizzle(getClient(), { schema });

export type Db = typeof db;

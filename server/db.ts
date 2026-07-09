import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";
import { config as dotenvConfig } from "dotenv";

// Load .env.local for local dev — no-op on Vercel where env vars are pre-set
try { dotenvConfig({ path: ".env.local" }); } catch { /* file not found in production */ }

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

export const db = drizzle(pool, { schema });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../shared/schema";
import { config as dotenvConfig } from "dotenv";

// Load .env.local for local dev — no-op on Vercel where env vars are pre-set
try { dotenvConfig({ path: ".env.local" }); } catch { /* file not found in production */ }

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
// drizzle({ client: sql }) uses the new unified API which calls sql as a tagged template,
// avoiding the @neondatabase/serverless v1.x "not a tagged-template" runtime error.
export const db = drizzle({ client: sql, schema });

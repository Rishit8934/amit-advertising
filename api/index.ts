import express from "express";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";
// Binary search: adding schema.ts (imports drizzle-orm/pg-core + drizzle-zod)
// If /api/ping crashes → schema.ts chain contains the crash

const app = express();
app.use(express.json());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 5000,
});
const db = drizzle(pool, { schema });

app.get("/api/ping", (_req, res) => res.json({ pong: true, schemaLoaded: true, tables: Object.keys(schema).length, time: Date.now() }));

app.get("/api/newspapers", async (_req, res) => {
  try {
    const { eq } = await import("drizzle-orm");
    const newspapers = await db.select().from(schema.newspapers).where(eq(schema.newspapers.active, true));
    res.json(newspapers);
  } catch (err: any) {
    res.json({ error: err.message });
  }
});

export default app;

import express from "express";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, boolean } from "drizzle-orm/pg-core";
// Binary search: only drizzle-orm/pg-core (no drizzle-zod, no zod, no full schema)
// If /api/ping crashes → drizzle-orm/pg-core is the culprit

const newspapers = pgTable("newspapers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").default(true),
});

const app = express();
app.use(express.json());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 5000,
});
const db = drizzle(pool, { schema: { newspapers } });

app.get("/api/ping", (_req, res) => res.json({ pong: true, pgCoreLoaded: true, time: Date.now() }));

app.get("/api/newspapers", async (_req, res) => {
  try {
    const { eq } = await import("drizzle-orm");
    const results = await db.select().from(newspapers).where(eq(newspapers.active, true));
    res.json(results);
  } catch (err: any) {
    res.json({ error: err.message });
  }
});

export default app;

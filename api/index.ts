import express from "express";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
// Binary search: test pg + drizzle-orm/node-postgres WITHOUT schema
// If /api/ping works → drizzle import is fine, crash is from schema.ts chain

const app = express();
app.use(express.json());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 5000,
});
const db = drizzle(pool);

app.get("/api/ping", (_req, res) => res.json({ pong: true, drizzleLoaded: true, time: Date.now() }));

app.get("/api/test-db", async (_req, res) => {
  try {
    const result = await pool.query("SELECT count(*) FROM newspapers");
    res.json({ ok: true, count: result.rows[0].count });
  } catch (err: any) {
    res.json({ ok: false, error: err.message });
  }
});

export default app;

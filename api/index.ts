import express from "express";
import pg from "pg";
// Binary search: test ONLY pg (no drizzle-orm, no schema)
// If /api/ping works → pg imports fine on Vercel, crash is from drizzle/schema
// If /api/ping crashes → pg itself breaks Vercel's ESM bundling

const app = express();
app.use(express.json());

app.get("/api/ping", (_req, res) => res.json({ pong: true, pgLoaded: true, time: Date.now() }));

app.get("/api/test-db", async (_req, res) => {
  try {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 5000,
    });
    const result = await pool.query("SELECT count(*) FROM newspapers");
    await pool.end();
    res.json({ ok: true, count: result.rows[0].count });
  } catch (err: any) {
    res.json({ ok: false, error: err.message });
  }
});

export default app;

import express from "express";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
// Binary search: add drizzle-zod
// If /api/ping crashes → drizzle-zod is the culprit

const newspapers = pgTable("newspapers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").default(true),
});

const InsertNewspaper = createInsertSchema(newspapers);

const app = express();
app.use(express.json());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 5000,
});
const db = drizzle(pool, { schema: { newspapers } });

app.get("/api/ping", (_req, res) => res.json({ pong: true, drizzleZodLoaded: true, time: Date.now() }));

export default app;

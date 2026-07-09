import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
// Diagnose: import ONLY the db chain (pg + drizzle + schema) without routes.ts
// This will show if pg causes the crash or if it's something in routes.ts
import { db } from "../server/db";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/api/ping", (_req, res) => res.json({ pong: true, time: Date.now() }));

app.get("/api/newspapers", async (_req, res) => {
  try {
    const newspapers = await db.select().from(schema.newspapers).where(eq(schema.newspapers.active, true));
    res.json(newspapers);
  } catch (err: any) {
    // Return 200 temporarily so we can read the error body (WebFetch hides 500 bodies)
    res.json({ DEBUG_ERROR: err.message, stack: err.stack?.split("\n").slice(0, 4) });
  }
});

app.post("/api/staff/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
  try {
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    const staff = await db.select().from(schema.staff).where(eq(schema.staff.username, username));
    if (!staff[0] || staff[0].password !== hash) return res.status(401).json({ error: "Invalid credentials" });
    const { randomUUID } = crypto;
    const sessionToken = randomUUID();
    res.json({ sessionToken, staff: { id: staff[0].id, username: staff[0].username, role: staff[0].role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

export default app;

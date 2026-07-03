import express, { type Request, Response, NextFunction } from "express";
import { db } from "../server/db";
import { newspapers } from "../shared/schema";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/api/newspapers", async (_req, res) => {
  try {
    const rows = await db.select().from(newspapers);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/ping", (_req, res) => res.json({ ok: true }));

export default app;

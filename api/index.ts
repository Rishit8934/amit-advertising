import express from "express";
import { db } from "../server/db";
import { newspapers } from "../shared/schema";

const app = express();
app.use(express.json());

app.get("/api/newspapers", async (_req, res) => {
  try {
    const rows = await db.select().from(newspapers).limit(5);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default app;

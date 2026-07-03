import express from "express";
import * as schema from "../shared/schema";

const app = express();

app.get("/api/newspapers", (_req, res) => {
  res.json({ ok: true, tables: Object.keys(schema).slice(0, 8) });
});

app.get("/api/ping", (_req, res) => res.json({ ok: true }));

export default app;

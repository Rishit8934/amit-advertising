import express from "express";

const app = express();
app.use(express.json());

app.get("/api/newspapers", (_req, res) => {
  res.json([{ id: "1", name: "Express works on Vercel!" }]);
});

app.get("/api/ping", (_req, res) => res.json({ ok: true }));

export default app;

import express from "express";

const app = express();

app.get("/api/newspapers", (_req, res) => {
  res.json([{ id: "test", name: "Express is working" }]);
});

export default app;

import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check registered FIRST — works even if route chain crashes
app.get("/api/ping", (_req, res) => res.json({ pong: true, time: Date.now() }));

let initError: string | null = null;

// Dynamic import defers route loading to after the module body starts.
// This means: even if routes.ts or its imports crash, /api/ping above still works.
// It also lets us catch and surface the exact crash message at /api/debug.
try {
  const { registerRoutes } = await import("../server/routes");
  const httpServer = createServer(app);
  registerRoutes(httpServer, app);
} catch (err) {
  initError = err instanceof Error
    ? `${err.name}: ${err.message}\n${err.stack?.split("\n").slice(0, 6).join("\n")}`
    : String(err);
  console.error("Route init failed:", initError);
}

// Exposes the init error so we can diagnose Vercel crashes remotely
app.get("/api/debug", (_req, res) => res.json({ initError }));

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

export default app;

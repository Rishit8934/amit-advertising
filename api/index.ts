import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";

let appCache: express.Express | null = null;

async function buildApp(): Promise<express.Express> {
  if (appCache) return appCache;
  const app = express();
  const httpServer = createServer(app);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  const { registerRoutes } = await import("../server/routes");
  registerRoutes(httpServer, app);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
  });
  appCache = app;
  return app;
}

export default async function handler(req: Request, res: Response) {
  try {
    const app = await buildApp();
    app(req, res);
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack?.split("\n").slice(0, 8) });
  }
}

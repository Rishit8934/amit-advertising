import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";

let app: express.Express | null = null;
let initError: string | null = null;

function getApp() {
  if (app) return app;
  if (initError) return null;
  try {
    const { registerRoutes } = require("../server/routes");
    const instance = express();
    const httpServer = createServer(instance);
    instance.use(express.json());
    instance.use(express.urlencoded({ extended: false }));
    registerRoutes(httpServer, instance);
    instance.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
    });
    app = instance;
  } catch (e: any) {
    initError = e.message + "\n" + e.stack;
  }
  return app;
}

export default function handler(req: Request, res: Response) {
  const instance = getApp();
  if (!instance) {
    return res.status(500).json({ error: "App failed to initialize", detail: initError });
  }
  instance(req, res);
}

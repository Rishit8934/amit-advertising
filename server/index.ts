import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { warmCache } from "./storage";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Global error handlers to log fatal errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

async function startServer() {
  try {
    console.log("Starting server setup...");
    console.log("About to register routes...");
    try {
      registerRoutes(httpServer, app);
      console.log("Routes registered successfully");
    } catch (routeError) {
      console.error("Error registering routes:", routeError);
      console.log("Continuing with basic routes only...");
    }
    
    // Add a simple test route
    app.get("/api/test", (req, res) => {
      console.log("Test route called");
      res.json({ message: "API is working", timestamp: new Date().toISOString() });
    });
    
    console.log("Routes registered successfully");

    // Serve attached_assets folder
    app.use('/attached_assets', express.static(path.join(__dirname, '../../attached_assets')));

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      // In development, serve Vite middleware so React pages work on the same port
      console.log("Development mode: serving Vite middleware and API on the same port");
      try {
        const { createServer: createViteServer } = await import("vite");
        const workspaceRoot = path.resolve(__dirname, "../");
        const viteRoot = path.resolve(workspaceRoot, "client");
        const viteConfigFile = path.resolve(workspaceRoot, "vite.config.ts");
        const vite = await createViteServer({
          root: viteRoot,
          configFile: viteConfigFile,
          server: {
            middlewareMode: "html" as any,
            watch: {
              usePolling: true,
            },
          },
        });
        app.use(vite.middlewares);
      } catch (viteError) {
        console.error("Failed to load Vite middleware in development mode:", viteError);
        console.log("Falling back to static file serving");
        serveStatic(app);
      }
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 3000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "3000", 10);
    console.log(`Attempting to listen on port ${port}...`);
    
    return new Promise<void>((resolve, reject) => {
      const server = httpServer.listen(
        {
          port,
          host: "0.0.0.0",
        },
        () => {
          console.log(`✅ Server successfully listening on port ${port}`);          console.log(`Server address: ${httpServer.address()}`);          log(`serving on port ${port}`);
          console.log(`Server is listening on http://127.0.0.1:${port}`);
          console.log(`Test URL: http://localhost:${port}/api/test`);
          resolve();
        },
      );

      server.on('error', (err) => {
        console.error('❌ Failed to start server:', err);
        reject(err);
      });

      httpServer.on('error', (error) => {
        console.error('❌ Server error:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    throw error;
  }
}

// Start the server
startServer().then(() => {
  console.log("Server started successfully");
  warmCache();
  // Keep the process alive
  setInterval(() => {
    // Keep alive
  }, 1000);
}).catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});

import express, { type Express, type Request, Response } from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";


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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Simple test route
app.get("/api/test", (req, res) => {
  console.log("Test route called");
  res.json({ message: "API is working", timestamp: new Date().toISOString() });
});

// Basic cities route (sample data)
app.get("/api/cities", (req, res) => {
  const sampleCities = [
    { id: "8354f611-606f-470b-8f84-73a2a8a5bfde", name: "Mumbai", state: "Maharashtra" },
    { id: "sample-city-2", name: "Delhi", state: "Delhi" },
    { id: "sample-city-3", name: "Bangalore", state: "Karnataka" }
  ];
  res.json(sampleCities);
});

// Basic newspapers route
app.get("/api/newspapers", (req, res) => {
  const sampleNewspapers = [
    { id: "1", name: "Times of India", active: true },
    { id: "2", name: "Hindustan Times", active: true },
    { id: "3", name: "The Hindu", active: true }
  ];
  res.json(sampleNewspapers);
});

// Fixed by-location route
app.get("/api/newspapers/by-location", (req, res) => {
  const { state, city } = req.query;
  console.log("by-location called with:", { state, city });

  // Return sample newspapers for testing
  const sampleNewspapers = [
    { id: "1", name: "Times of India", active: true },
    { id: "2", name: "Hindustan Times", active: true }
  ];
  console.log("Returning newspapers:", sampleNewspapers.length);
  res.json(sampleNewspapers);
});

// Serve static files
function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist");
  const publicPath = path.resolve(distPath, "public");

  if (!fs.existsSync(publicPath)) {
    console.warn(
      `Could not find the build directory: ${publicPath}, serving API only`,
    );
    return;
  }

  app.use(express.static(publicPath));
}

// Add a specific route for the root
app.get("/", (req, res) => {
  const indexPath = path.resolve(process.cwd(), "dist", "public", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("Frontend not built yet. API is working.");
  }
});

async function startServer() {
  try {
    console.log("Starting server setup...");

    // Serve static files
    serveStatic(app);

    // Start the server
    const port = parseInt(process.env.PORT || "3000", 10);
    console.log(`Attempting to listen on port ${port}...`);

    return new Promise<void>((resolve, reject) => {
      const server = httpServer.listen(
        {
          port,
          host: "127.0.0.1",
        },
        () => {
          console.log(`✅ Server successfully listening on port ${port}`);
          console.log(`Server address: ${httpServer.address()}`);
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
  // Keep the process alive
  setInterval(() => {
    // Keep alive
  }, 1000);
}).catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
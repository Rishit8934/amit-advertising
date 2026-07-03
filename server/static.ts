import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist");
  const publicPath = path.resolve(distPath, "public");
  
  if (!fs.existsSync(publicPath)) {
    console.warn(
      `Could not find the build directory: ${publicPath}, serving API only`,
    );
    // Don't throw error, just serve API only
    return;
  }

  // Special handling for signature.png - disable caching
  app.get("/signature.png", (req, res) => {
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    res.sendFile(path.resolve(publicPath, "signature.png"));
  });

  app.use(express.static(publicPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
}

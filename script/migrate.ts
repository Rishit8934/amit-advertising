import Database from "better-sqlite3";
import fs from "fs";

const DB_PATH = "data.db";

if (!fs.existsSync(DB_PATH)) {
  console.error("Database file not found:", DB_PATH);
  process.exit(1);
}

const db = new Database(DB_PATH);

console.log("Running migrations...");

// Add category_id to packages if missing
try {
  const info = db.prepare("PRAGMA table_info(packages)").all();
  const hasCategory = info.some((c: any) => c.name === "category_id");
  if (!hasCategory) {
    console.log("Adding column packages.category_id");
    db.prepare("ALTER TABLE packages ADD COLUMN category_id TEXT").run();
  } else {
    console.log("packages.category_id already exists");
  }
} catch (err) {
  console.error("Error updating packages table:", err);
}

// Create staff_logins table if missing
try {
  const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='staff_logins'");
  const row = stmt.get();
  if (!row) {
    console.log("Creating staff_logins table");
    db.prepare(`CREATE TABLE staff_logins (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      user_id TEXT,
      created_at INTEGER NOT NULL
    )`).run();
  } else {
    console.log("staff_logins already exists");
  }
} catch (err) {
  console.error("Error creating staff_logins table:", err);
}

// Add igst to bills if missing
try {
  const info = db.prepare("PRAGMA table_info(bills)").all();
  const hasIgst = info.some((c: any) => c.name === "igst");
  if (!hasIgst) {
    console.log("Adding column bills.igst");
    db.prepare("ALTER TABLE bills ADD COLUMN igst INTEGER").run();
  } else {
    console.log("bills.igst already exists");
  }
} catch (err) {
  console.error("Error updating bills table:", err);
}

console.log("Migrations complete.");

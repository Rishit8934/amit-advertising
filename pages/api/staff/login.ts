import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../server/storage";
import { createSession } from "../../../server/sessions";
import crypto from "crypto";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  try {
    const staff = await storage.getStaffByUsername(username);
    if (!staff || staff.password !== hashPassword(password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const admin = staff.role === "admin" || ["admin@staff.com", "admin@amitads.com"].includes((staff.username || "").toLowerCase());
    const sessionToken = createSession(staff.id, staff.username, admin ? "admin" : staff.role);

    // Optionally record login history; don't block response
    try {
      await storage.createStaffLogin({ userEmail: staff.username, userId: staff.id });
    } catch (e) {
      // ignore
    }

    return res.json({ sessionToken, staff: { id: staff.id, username: staff.username, role: admin ? "admin" : staff.role } });
  } catch (err) {
    console.error("staff login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

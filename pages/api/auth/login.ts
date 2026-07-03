import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../server/storage";
import { createSession } from "../../../server/sessions";
import * as crypto from "crypto";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const user = await storage.getUserByUsername(email);
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const sessionToken = createSession(user.id, user.username);
    res.status(200).json({ sessionToken, user: { id: user.id, email: user.username } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
}

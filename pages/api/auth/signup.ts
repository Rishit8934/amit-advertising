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
    const existing = await storage.getUserByUsername(email);
    if (existing) return res.status(409).json({ error: "User already exists" });

    const user = await storage.createUser({ username: email, password: hashPassword(password) });
    const sessionToken = createSession(user.id, user.username);
    res.status(200).json({ sessionToken, user: { id: user.id, email: user.username } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
}

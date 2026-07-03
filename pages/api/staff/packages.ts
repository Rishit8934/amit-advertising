import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../server/storage";
import { getSession } from "../../../server/sessions";

function requireStaff(req: NextApiRequest) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  return getSession(token);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireStaff(req);
  if (!session) return res.status(401).json({ error: "Staff authentication required" });

  try {
    const data = await storage.getAllPackages();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
}

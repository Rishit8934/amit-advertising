import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../../server/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  try {
    const newspaper = await storage.getNewspaper(id as string);
    if (!newspaper || !newspaper.active) return res.status(404).json({ error: "Newspaper not found" });
    res.status(200).json(newspaper);
  } catch (error) {
    console.error("/api/newspapers/[id] error:", error);
    res.status(500).json({ error: "Failed to fetch newspaper" });
  }
}

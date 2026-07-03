import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../../server/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  try {
    const adTypes = await storage.getAdTypesByNewspaper(id as string);
    res.status(200).json(adTypes);
  } catch (error) {
    console.error("/api/newspapers/[id]/ad-types error:", error);
    res.status(500).json({ error: "Failed to fetch ad types" });
  }
}

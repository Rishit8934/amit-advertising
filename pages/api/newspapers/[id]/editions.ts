import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../../server/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  try {
    const editions = await storage.getEditionsByNewspaper(id as string);
    res.status(200).json(editions);
  } catch (error) {
    console.error("/api/newspapers/[id]/editions error:", error);
    res.status(500).json({ error: "Failed to fetch editions" });
  }
}

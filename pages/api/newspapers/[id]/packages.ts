import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../../server/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  try {
    const packages = await storage.getPackagesByNewspaper(id as string);
    const active = packages.filter((p: any) => p.active);
    res.status(200).json(active);
  } catch (error) {
    console.error("/api/newspapers/[id]/packages error:", error);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
}

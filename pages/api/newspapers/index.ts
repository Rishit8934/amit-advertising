import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../server/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const newspapers = await storage.getAllNewspapers();
    const active = newspapers.filter((n: any) => n.active);
    res.status(200).json(active);
  } catch (error) {
    console.error("/api/newspapers error:", error);
    res.status(500).json({ error: "Failed to fetch newspapers" });
  }
}

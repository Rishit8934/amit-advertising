import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../server/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await storage.getAllAdEnchantments();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch ad enchantments" });
  }
}

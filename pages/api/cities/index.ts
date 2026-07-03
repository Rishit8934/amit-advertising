import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../server/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const cities = await storage.getAllCities();
    res.status(200).json(cities);
  } catch (error) {
    console.error("/api/cities error:", error);
    res.status(500).json({ error: "Failed to fetch cities" });
  }
}

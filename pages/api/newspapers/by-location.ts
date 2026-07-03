import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../server/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { state, city } = req.query;

  try {
    let newspapers: any[] = [];

    if (city) {
      const cityData = await storage.getCity(city as string);
      if (cityData) {
        const newspaperIds = await storage.getNewspaperIdsByCity(cityData.id);
        if (newspaperIds.length > 0) {
          newspapers = await storage.getNewspapersByIds(newspaperIds);
          newspapers = newspapers.filter((n: any) => n && n.active);
        }
      }
    } else if (state) {
      const newspaperIds = await storage.getNewspaperIdsByState(state as string);
      if (newspaperIds.length > 0) {
        newspapers = await storage.getNewspapersByIds(newspaperIds);
        newspapers = newspapers.filter((n: any) => n && n.active);
      }
    }

    if (newspapers.length === 0) {
      newspapers = await storage.getAllNewspapers();
      newspapers = newspapers.filter((n: any) => n && n.active);
    }

    res.status(200).json(newspapers);
  } catch (error) {
    console.error("Error in Next API /api/newspapers/by-location:", error);
    res.status(500).json({ error: "Failed to fetch newspapers by location" });
  }
}

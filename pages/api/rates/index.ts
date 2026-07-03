import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../server/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { newspaperId, adTypeId, categoryId, editionId, cityId, sizeUnit } = req.query;

  try {
    const criteria: any = {};
    if (newspaperId) criteria.newspaperId = newspaperId as string;
    if (adTypeId) criteria.adTypeId = adTypeId as string;
    if (categoryId) criteria.categoryId = categoryId as string;
    if (editionId) criteria.editionId = editionId as string;
    if (cityId) criteria.cityId = cityId as string;
    if (sizeUnit) criteria.sizeUnit = sizeUnit as string;

    const rates = await storage.getRatesByCriteria(criteria);
    res.status(200).json(rates);
  } catch (error) {
    console.error("/api/rates error:", error);
    res.status(500).json({ error: "Failed to fetch rates" });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../server/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { newspaper, package: packageId, city, adType, category, size, publishDates, edition, enchantments } = req.body;

  let baseRate = 0;
  let estimatedTotal = 0;

  try {
    if (packageId) {
      const pkg = await storage.getPackage(packageId);
      if (pkg) {
        if (pkg.pricingType === 'per_word') {
          baseRate = pkg.price || 0;
          estimatedTotal = baseRate * size.value;
        } else if (pkg.pricingType === 'per_line') {
          baseRate = pkg.price || 0;
          estimatedTotal = baseRate * size.value;
        }
      }
    } else {
      const matchingRates = await storage.getRatesByCriteria({
        newspaperId: newspaper,
        adTypeId: adType,
        categoryId: category,
        editionId: edition,
        cityId: city,
        sizeUnit: size.unit === 'word' ? 'per_word' : 'per_line'
      });

      if (matchingRates.length > 0) {
        const categoryRate = matchingRates.find((r: any) => r.categoryId === category);
        const generalRate = matchingRates.find((r: any) => !r.categoryId);
        const selectedRate = categoryRate || generalRate || matchingRates[0];
        baseRate = selectedRate.baseRate;
        estimatedTotal = baseRate * size.value;
      } else {
        const newspaperData = await storage.getNewspaper(newspaper);
        if (newspaperData) {
          if (newspaperData.pricingUnit === 'word') {
            baseRate = 5;
            estimatedTotal = baseRate * size.value;
          } else {
            baseRate = 50;
            estimatedTotal = baseRate * size.value;
          }
        }
      }
    }

    const datesCount = Array.isArray(publishDates) ? publishDates.length : 1;
    estimatedTotal *= datesCount;

    let enchantmentTotal = 0;
    if (enchantments && Array.isArray(enchantments)) {
      for (const enchId of enchantments) {
        const newspaperRates = await storage.getEnchantmentRatesByNewspaper(newspaper);
        const match = newspaperRates.find((r: any) => r.enchantmentId === enchId);
        if (match && match.price) {
          enchantmentTotal += (match.price / 100);
        } else {
          const allEnchs = await storage.getAllAdEnchantments();
          const def = allEnchs.find((e: any) => e.id === enchId);
          if (def && def.price) enchantmentTotal += (def.price / 100);
        }
      }
    }

    const subtotal = estimatedTotal + enchantmentTotal;
    const gst = +(subtotal * 0.05).toFixed(2);
    const totalWithGst = +(subtotal + gst).toFixed(2);

    res.status(200).json({
      baseRate,
      estimatedTotal,
      enchantmentTotal,
      gst,
      totalWithGst,
      currency: "INR",
      breakdown: { baseRate, sizeMultiplier: size.value, dateMultiplier: datesCount, packageUsed: !!packageId }
    });
  } catch (error) {
    console.error("Error calculating estimate:", error);
    res.status(500).json({ error: "Failed to calculate estimate" });
  }
}

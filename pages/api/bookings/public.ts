import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../server/storage";
import { getSession } from "../../../server/sessions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    adMatterId,
    edition: editionValue,
    city: cityValueRaw,
    cityName,
    newspaperId,
    package: packageId,
    options,
    publishDates,
    calculatedPricing,
  } = req.body;

  const auth = req.headers.authorization?.replace("Bearer ", "");
  const session = getSession(auth);
  const userId = session?.userId || null;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to persist bookings' });
  }

  const cityValue = cityValueRaw || cityName || '';
  const publishDatesValue = Array.isArray(publishDates) ? publishDates : publishDates ? [publishDates] : [];

  if (!adMatterId || !cityValue || publishDatesValue.length === 0) {
    return res.status(400).json({ error: "Missing required booking fields" });
  }

  try {
    let city = await storage.getCity(cityValue);
    if (!city) {
      city = await storage.getCityByName(cityValue);
    }

    if (!city) return res.status(400).json({ error: "Invalid city" });

    const cityId = city.id;
    let editionId = editionValue;
    if (!editionId && newspaperId) {
      const editions = await storage.getEditionsByCity(city.id);
      const matchingEdition = editions.find((edition) => edition.newspaperId === newspaperId);
      if (matchingEdition) editionId = matchingEdition.id;
    }

    if (!editionId && newspaperId) {
      const editions = await storage.getEditionsByNewspaper(newspaperId);
      if (editions.length > 0) editionId = editions[0].id;
    }

    if (!editionId) return res.status(400).json({ error: "Missing required booking fields" });

    const edition = await storage.getEdition(editionId);

    const booking = await storage.createBooking({
      adMatterId,
      editionId,
      cityId,
      packageId: packageId || null,
      userId,
      roNumber: null,
      customAdText: "",
      options: JSON.stringify(options || {}),
      publishDates: JSON.stringify(Array.isArray(publishDates) ? publishDates : [publishDates]),
      calculatedPricing: JSON.stringify(calculatedPricing || { publishDates, createdAt: Date.now() }),
      paymentMethod: null,
      status: "submitted",
      adminNotes: null,
      edition: edition?.editionName || "",
      city: city?.name || "",
      subcategory: "",
      classification: "",
      paymentDetails: "",
      remarks: "",
    });

    res.status(200).json(booking);
  } catch (error) {
    console.error("Failed to persist booking record:", error);
    res.status(500).json({ error: "Failed to persist booking record" });
  }
}

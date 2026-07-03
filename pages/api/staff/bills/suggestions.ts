import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../../server/storage";
import { getSession } from "../../../../server/sessions";

function requireStaff(req: NextApiRequest) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  return getSession(token);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireStaff(req);
  if (!session) return res.status(401).json({ error: "Staff authentication required" });

  const { search } = req.query;

  try {
    // For now, return empty suggestions as we would need a dedicated search endpoint in storage
    // This is a placeholder that can be extended to query bills by client name
    const allBills = await storage.getAllBills();
    const suggestions = allBills
      .filter(bill => {
        const clientName = (bill as any).clientName || "";
        return clientName.toLowerCase().includes(String(search || "").toLowerCase());
      })
      .slice(0, 10)
      .map(bill => ({
        clientName: (bill as any).clientName,
        clientNumber: (bill as any).clientNumber,
        clientAddress: (bill as any).clientAddress,
        clientGST: (bill as any).clientGST,
        clientState: (bill as any).clientState
      }));

    res.json(suggestions);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
}

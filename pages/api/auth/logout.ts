import type { NextApiRequest, NextApiResponse } from "next";
import { sessions } from "../../../server/sessions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) sessions.delete(token);
  res.json({ success: true });
}

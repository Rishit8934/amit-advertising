import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    ok: true,
    env: {
      hasDB: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}

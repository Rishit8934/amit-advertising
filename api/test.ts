import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from "@neondatabase/serverless";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query("SELECT COUNT(*) as c FROM newspapers");
    await pool.end();
    res.json({ ok: true, newspapers: result.rows[0].c });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

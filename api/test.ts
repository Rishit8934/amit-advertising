import { neon } from "@neondatabase/serverless";

export default async function handler(req: any, res: any) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT count(*) FROM newspapers`;
    res.json({ ok: true, hasDB: !!process.env.DATABASE_URL, newspapers: Number(result[0].count) });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { getDb } from '@/db/drizzle';
import { campaignAnalytics, campaigns } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAdmin(req, res)) return;

  const { campaignId, limit = '50' } = req.query;
  const db = getDb();

  const rows = typeof campaignId === 'string'
    ? await db.select().from(campaignAnalytics).where(eq(campaignAnalytics.campaignId, campaignId)).orderBy(desc(campaignAnalytics.recordedAt)).limit(Number(limit))
    : await db.select().from(campaignAnalytics).orderBy(desc(campaignAnalytics.recordedAt)).limit(Number(limit));

  const campaignIds = [...new Set(rows.map(r => r.campaignId))];
  const campaignRows = campaignIds.length > 0
    ? await db.select({ id: campaigns.id, name: campaigns.name }).from(campaigns).where(inArray(campaigns.id, campaignIds))
    : [];
  const campaignMap: Record<string, string> = {};
  for (const c of campaignRows) campaignMap[c.id] = c.name;

  const analytics = rows.map(r => ({ ...r, campaignName: campaignMap[r.campaignId] ?? r.campaignId }));
  return res.status(200).json({ analytics });
}

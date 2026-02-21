import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { getDb } from '@/db/drizzle';
import { campaignOutreach } from '@/db/schema';
import type { OutreachStatus } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';

const VALID_OUTREACH_STATUSES: OutreachStatus[] = ['draft', 'pending_approval', 'sent', 'failed'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAdmin(req, res)) return;

  const { campaignId, status, limit = '50' } = req.query;
  const db = getDb();
  const conditions = [];
  if (typeof campaignId === 'string') conditions.push(eq(campaignOutreach.campaignId, campaignId));
  if (typeof status === 'string' && VALID_OUTREACH_STATUSES.includes(status as OutreachStatus)) {
    conditions.push(eq(campaignOutreach.status, status as OutreachStatus));
  }

  const rows = conditions.length > 0
    ? await db.select().from(campaignOutreach).where(and(...conditions)).orderBy(desc(campaignOutreach.createdAt)).limit(Number(limit))
    : await db.select().from(campaignOutreach).orderBy(desc(campaignOutreach.createdAt)).limit(Number(limit));
  return res.status(200).json({ outreach: rows });
}

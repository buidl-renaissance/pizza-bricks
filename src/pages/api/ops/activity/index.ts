import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { listActivityEvents } from '@/db/ops';
import type { ActivityEventType, TriggeredBy } from '@/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAdmin(req, res)) return;

  const { type, triggeredBy, limit = '50', offset = '0' } = req.query;
  const events = await listActivityEvents({
    type: type as ActivityEventType | undefined,
    triggeredBy: triggeredBy as TriggeredBy | undefined,
    limit: Number(limit),
    offset: Number(offset),
  });
  return res.status(200).json({ events });
}

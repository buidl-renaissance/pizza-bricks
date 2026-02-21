import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRead } from '@/lib/ops-auth';
import { getPipelineSummary } from '@/db/ops';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireRead(req, res)) return;

  const stages = await getPipelineSummary();
  return res.status(200).json({ stages });
}

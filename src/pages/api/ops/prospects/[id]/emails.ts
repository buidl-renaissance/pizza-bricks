import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRead } from '@/lib/ops-auth';
import { getProspect, getEmailLogsByProspect } from '@/db/ops';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireRead(req, res)) return;

  const { id } = req.query as { id: string };
  if (!id) return res.status(400).json({ error: 'Prospect id required' });

  const prospect = await getProspect(id);
  if (!prospect) return res.status(404).json({ error: 'Prospect not found' });

  const logs = await getEmailLogsByProspect(id);
  return res.status(200).json({ logs });
}

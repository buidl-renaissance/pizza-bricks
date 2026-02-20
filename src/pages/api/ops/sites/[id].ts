import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { getGeneratedSite, getProspect } from '@/db/ops';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAdmin(req, res)) return;

  const { id } = req.query as { id: string };
  const site = await getGeneratedSite(id);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const prospect = await getProspect(site.prospectId);
  return res.status(200).json({
    site: { ...site, prospectName: prospect?.name ?? site.prospectId },
  });
}

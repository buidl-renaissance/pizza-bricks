import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { listGeneratedSites, getProspect } from '@/db/ops';
import type { GeneratedSiteStatus } from '@/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAdmin(req, res)) return;

  const { prospectId, status, limit = '50' } = req.query;
  const sites = await listGeneratedSites({
    prospectId: prospectId as string | undefined,
    status: status as GeneratedSiteStatus | undefined,
    limit: Number(limit),
  });

  // Enrich with prospect name
  const enriched = await Promise.all(
    sites.map(async (s) => {
      const prospect = await getProspect(s.prospectId);
      return { ...s, prospectName: prospect?.name ?? s.prospectId };
    })
  );

  return res.status(200).json({ sites: enriched });
}

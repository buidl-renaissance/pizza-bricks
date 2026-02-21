import type { NextApiRequest, NextApiResponse } from 'next';
import { getGeneratedSite } from '@/db/ops';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { siteId } = req.query as { siteId: string };
  if (!siteId) {
    return res.status(400).json({ error: 'siteId is required' });
  }

  const site = await getGeneratedSite(siteId);
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }

  return res.status(200).json({
    url: site.url,
    status: site.status,
  });
}

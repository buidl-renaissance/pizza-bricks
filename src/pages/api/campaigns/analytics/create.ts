import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { insertCampaignAnalytic, getCampaign } from '@/db/campaigns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAdmin(req, res)) return;

  try {
    const { campaignId, revenue, footTraffic, socialReach, newFollowers, conversionLift } = req.body ?? {};
    if (!campaignId || typeof campaignId !== 'string') {
      return res.status(400).json({ error: 'campaignId is required' });
    }

    const campaign = await getCampaign(campaignId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const analyticId = await insertCampaignAnalytic({
      campaignId,
      revenue: typeof revenue === 'number' ? revenue : undefined,
      footTraffic: typeof footTraffic === 'number' ? footTraffic : undefined,
      socialReach: typeof socialReach === 'number' ? socialReach : undefined,
      newFollowers: typeof newFollowers === 'number' ? newFollowers : undefined,
      conversionLift: typeof conversionLift === 'string' ? conversionLift : undefined,
    });
    return res.status(201).json({ analytic: { id: analyticId, campaignId } });
  } catch (err) {
    console.error('[campaigns/analytics/create]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
}

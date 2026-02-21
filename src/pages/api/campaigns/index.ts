import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { listCampaigns, getCampaignEventByCampaignId } from '@/db/campaigns';
import type { CampaignStatus } from '@/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAdmin(req, res)) return;

  const { status, vendorId, prospectId, limit = '50', offset = '0', includeEvents = '' } = req.query;
  const campaigns = await listCampaigns({
    status: status as CampaignStatus | undefined,
    vendorId: vendorId as string | undefined,
    prospectId: prospectId as string | undefined,
    limit: Number(limit),
    offset: Number(offset),
  });

  const includeEventsFlag = includeEvents === 'true' || includeEvents === '1';
  if (includeEventsFlag) {
    const withEvents = await Promise.all(
      campaigns.map(async (c) => {
        const event = await getCampaignEventByCampaignId(c.id);
        return { ...c, event: event ?? null };
      })
    );
    return res.status(200).json({ campaigns: withEvents });
  }

  return res.status(200).json({ campaigns });
}

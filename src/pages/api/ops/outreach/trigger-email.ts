import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { getProspect, getLatestPublishedSiteForProspect } from '@/db/ops';
import { triggerOutreachEmailForPublishedSite } from '@/lib/outreach-auto-send';

/**
 * POST /api/ops/outreach/trigger-email
 * Trigger the initial outreach email for a prospect after their website has been generated.
 * Body: { prospectId: string }
 * Prospect must have metadata.vendorId (from Vendor Outreach flow) and a published site.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAdmin(req, res)) return;

  const { prospectId } = req.body ?? {};
  if (!prospectId || typeof prospectId !== 'string') {
    return res.status(400).json({ error: 'prospectId is required' });
  }

  const prospect = await getProspect(prospectId);
  if (!prospect) {
    return res.status(404).json({ error: 'Prospect not found' });
  }

  let meta: { vendorId?: string } = {};
  if (prospect.metadata) {
    try {
      meta = JSON.parse(prospect.metadata) as { vendorId?: string };
    } catch {
      /* ignore */
    }
  }
  if (!meta.vendorId) {
    return res.status(400).json({
      error: 'Prospect is not from Vendor Outreach (no vendorId). Use Discover & outreach to add vendors first.',
    });
  }

  const site = await getLatestPublishedSiteForProspect(prospectId);
  if (!site?.url) {
    return res.status(400).json({
      error: 'No published site for this prospect. Generate and publish a site first.',
    });
  }

  const result = await triggerOutreachEmailForPublishedSite(prospectId, site.url);
  if (!result.sent) {
    return res.status(500).json({
      error: result.error ?? 'Failed to send outreach email',
    });
  }

  return res.status(200).json({ success: true, sent: true });
}

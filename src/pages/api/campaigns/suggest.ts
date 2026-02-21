import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { runSuggestCampaign } from '@/lib/agent/workflows/suggest-campaign';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAdmin(req, res)) return;

  try {
    const { vendorId, prospectId, budgetHint, city } = req.body ?? {};
    const result = await runSuggestCampaign({
      vendorId: typeof vendorId === 'string' ? vendorId : undefined,
      prospectId: typeof prospectId === 'string' ? prospectId : undefined,
      budgetHint: typeof budgetHint === 'number' ? budgetHint : undefined,
      city: typeof city === 'string' ? city : undefined,
    });
    return res.status(200).json({ success: true, campaign: result });
  } catch (err) {
    console.error('[campaigns/suggest]', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to suggest campaign',
    });
  }
}

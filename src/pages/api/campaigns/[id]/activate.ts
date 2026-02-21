import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { runCampaignActivate } from '@/lib/campaign-activate-runner';

/**
 * x402-protected campaign activation endpoint ($1.00 USDC on Base).
 * Middleware in src/middleware.ts verifies payment before this handler runs.
 * Payment proof is set on the response header X-PAYMENT-RESPONSE.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await requireAdmin(req, res))) return;

  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid campaign ID' });

  try {
    const result = await runCampaignActivate(id);
    const paymentTx = req.headers['x-payment-response'] as string | undefined;
    if (paymentTx) console.log(`[x402] Campaign activate paid — campaignId: ${id}, tx: ${paymentTx}`);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[campaigns/activate]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Campaign not found') {
      return res.status(404).json({ error: message });
    }
    if (message.includes('cannot activate')) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
}

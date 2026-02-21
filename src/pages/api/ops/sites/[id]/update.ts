import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { getGeneratedSite, getProspect, insertActivityEvent } from '@/db/ops';
import { runSiteUpdate } from '@/lib/site-update-runner';

/**
 * x402-protected website update endpoint ($0.50 USDC on Base).
 * Middleware in src/middleware.ts verifies payment before this handler runs.
 * Payment proof is set on the response header X-PAYMENT-RESPONSE.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: true; url: string; message?: string } | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const { id: siteId } = req.query as { id: string };
  if (!siteId) {
    return res.status(400).json({ error: 'Site id is required' });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const site = await getGeneratedSite(siteId);
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }
  const prospect = await getProspect(site.prospectId);

  try {
    const result = await runSiteUpdate(siteId, prompt);
    const paymentTx = req.headers['x-payment-response'] as string | undefined;
    if (paymentTx) console.log(`[x402] Website update paid — siteId: ${siteId}, url: ${result.url}, tx: ${paymentTx}`);
    return res.status(200).json({ success: true, url: result.url, message: result.message });
  } catch (err) {
    console.error('[sites/update] error:', err);
    if (site?.prospectId && prospect) {
      await insertActivityEvent({
        type: 'agent_error',
        prospectId: site.prospectId,
        targetLabel: prospect.name,
        detail: `Website update failed: ${err instanceof Error ? err.message : String(err)}`,
        status: 'failed',
        triggeredBy: 'manual',
        metadata: { siteId, prompt },
      });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Site not found' || message === 'Prospect not found') {
      return res.status(404).json({ error: message });
    }
    if (message.includes('no deployment') || message.includes('No source files')) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
}

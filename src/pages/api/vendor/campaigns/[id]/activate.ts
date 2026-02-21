import type { NextApiRequest, NextApiResponse } from 'next';
import { desc, sql } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendorOnboardings } from '@/db/schema';
import { getCampaign } from '@/db/campaigns';
import { runCampaignActivate } from '@/lib/campaign-activate-runner';

/**
 * Resolve vendorId from wallet (same as vendor/me).
 */
async function getVendorIdByWallet(wallet: string): Promise<string | null> {
  const db = getDb();
  const onboarding = await db
    .select({ vendorId: vendorOnboardings.vendorId })
    .from(vendorOnboardings)
    .where(sql`LOWER(${vendorOnboardings.walletAddress}) = LOWER(${wallet})`)
    .orderBy(desc(vendorOnboardings.completedAt), desc(vendorOnboardings.updatedAt))
    .limit(1)
    .then((r) => r[0] ?? null);
  return onboarding?.vendorId ?? null;
}

/**
 * x402-protected vendor campaign activation ($1.00 USDC on Base).
 * Body: { wallet: string }
 * Verifies the wallet owns the vendor that owns the campaign, then runs the same activate flow as ops.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: campaignId } = req.query as { id: string };
  if (!campaignId) {
    return res.status(400).json({ error: 'Campaign id is required' });
  }

  const wallet = typeof req.body?.wallet === 'string' ? req.body.wallet.trim() : null;
  if (!wallet) {
    return res.status(400).json({ error: 'wallet is required' });
  }

  const vendorId = await getVendorIdByWallet(wallet);
  if (!vendorId) {
    return res.status(403).json({ error: 'Vendor not found for this wallet. Complete onboarding first.' });
  }

  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  if (campaign.vendorId !== vendorId) {
    return res.status(403).json({ error: 'You do not have access to this campaign.' });
  }

  try {
    const result = await runCampaignActivate(campaignId);
    const paymentTx = req.headers['x-payment-response'] as string | undefined;
    if (paymentTx) console.log(`[x402] Vendor campaign activate paid — campaignId: ${campaignId}, tx: ${paymentTx}`);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[vendor/campaigns/activate]', err);
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

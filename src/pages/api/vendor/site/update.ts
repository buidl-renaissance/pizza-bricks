import type { NextApiRequest, NextApiResponse } from 'next';
import { desc, sql } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendorOnboardings } from '@/db/schema';
import { getProspectByVendorId, listGeneratedSites, insertSiteUpdateJob, updateSiteUpdateJob } from '@/db/ops';
import { runSiteUpdate } from '@/lib/site-update-runner';

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
 * x402-protected vendor website update ($0.50 USDC on Base).
 * Body: { wallet: string, prompt: string, siteId?: string }
 * Creates a background job and returns 202 with jobId. Client should poll GET /api/vendor/site/update/status?jobId=.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | { jobId: string; siteId: string; status: string }
    | { success: true; url: string; message?: string }
    | { error: string }
  >
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const wallet = typeof req.body?.wallet === 'string' ? req.body.wallet.trim() : null;
  if (!wallet) {
    return res.status(400).json({ error: 'wallet is required' });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const vendorId = await getVendorIdByWallet(wallet);
  if (!vendorId) {
    return res.status(403).json({ error: 'Vendor not found for this wallet. Complete onboarding first.' });
  }

  const prospect = await getProspectByVendorId(vendorId);
  if (!prospect) {
    return res.status(404).json({ error: 'No site linked to your vendor account yet.' });
  }

  const sites = await listGeneratedSites({ prospectId: prospect.id, limit: 20 });
  const siteIdFromBody = typeof req.body?.siteId === 'string' ? req.body.siteId.trim() : null;

  let siteId: string;
  if (siteIdFromBody) {
    const allowed = sites.some((s) => s.id === siteIdFromBody);
    if (!allowed) {
      return res.status(403).json({ error: 'You do not have access to this site.' });
    }
    siteId = siteIdFromBody;
  } else {
    const publishedOrWithUrl = sites.filter((s) => s.status === 'published' || s.url);
    if (publishedOrWithUrl.length === 0) {
      return res.status(400).json({ error: 'Your site is not ready yet. No published site to update.' });
    }
    if (publishedOrWithUrl.length > 1) {
      return res.status(400).json({ error: 'Multiple sites found. Please provide siteId in the request body.' });
    }
    siteId = publishedOrWithUrl[0].id;
  }

  const paymentTx = req.headers['x-payment-response'] as string | undefined;
  if (paymentTx) console.log(`[x402] Vendor website update paid — siteId: ${siteId}, tx: ${paymentTx}`);

  const job = await insertSiteUpdateJob({ siteId, prompt });

  // Run update in background (do not await)
  void (async () => {
    try {
      await updateSiteUpdateJob(job.id, { status: 'running' });
      const result = await runSiteUpdate(siteId, prompt);
      await updateSiteUpdateJob(job.id, {
        status: 'completed',
        resultUrl: result.url,
        completedAt: new Date(),
      });
    } catch (err) {
      console.error('[vendor/site/update] background error:', err);
      const message = err instanceof Error ? err.message : 'Internal server error';
      await updateSiteUpdateJob(job.id, {
        status: 'failed',
        errorMessage: message,
        completedAt: new Date(),
      });
    }
  })();

  return res.status(202).json({ jobId: job.id, siteId, status: 'pending' });
}

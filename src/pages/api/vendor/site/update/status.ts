import type { NextApiRequest, NextApiResponse } from 'next';
import { desc, sql } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendorOnboardings } from '@/db/schema';
import { getProspectByVendorId, listGeneratedSites, getSiteUpdateJob } from '@/db/ops';

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
 * GET /api/vendor/site/update/status?jobId=xxx&wallet=xxx
 * Returns job status for a vendor-owned site update job.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | { status: string; resultUrl?: string | null; errorMessage?: string | null; url?: string }
    | { error: string }
  >
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const jobId = typeof req.query?.jobId === 'string' ? req.query.jobId.trim() : null;
  const wallet = typeof req.query?.wallet === 'string' ? req.query.wallet.trim() : null;

  if (!jobId) {
    return res.status(400).json({ error: 'jobId is required' });
  }
  if (!wallet) {
    return res.status(400).json({ error: 'wallet is required' });
  }

  const job = await getSiteUpdateJob(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const vendorId = await getVendorIdByWallet(wallet);
  if (!vendorId) {
    return res.status(403).json({ error: 'Vendor not found for this wallet.' });
  }

  const prospect = await getProspectByVendorId(vendorId);
  if (!prospect) {
    return res.status(403).json({ error: 'No site linked to your vendor account.' });
  }

  const sites = await listGeneratedSites({ prospectId: prospect.id, limit: 100 });
  const allowed = sites.some((s) => s.id === job.siteId);
  if (!allowed) {
    return res.status(403).json({ error: 'You do not have access to this job.' });
  }

  const payload: { status: string; resultUrl?: string | null; errorMessage?: string | null; url?: string } = {
    status: job.status,
  };
  if (job.resultUrl != null) payload.resultUrl = job.resultUrl;
  if (job.errorMessage != null) payload.errorMessage = job.errorMessage;
  if (job.resultUrl) payload.url = job.resultUrl;

  return res.status(200).json(payload);
}

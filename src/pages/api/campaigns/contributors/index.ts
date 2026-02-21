import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { listContributors } from '@/db/campaigns';
import type { ContributorRole } from '@/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAdmin(req, res)) return;

  const { vendorId, prospectId, role, limit = '100', offset = '0' } = req.query;
  const contributors = await listContributors({
    vendorId: vendorId as string | undefined,
    prospectId: prospectId as string | undefined,
    role: role as ContributorRole | undefined,
    limit: Number(limit),
    offset: Number(offset),
  });
  return res.status(200).json({ contributors });
}

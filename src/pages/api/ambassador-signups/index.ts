import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { listAmbassadorSignups } from '@/db/ambassadorSignups';
import type { AmbassadorSignupStatus } from '@/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const status = typeof req.query.status === 'string' ? (req.query.status as AmbassadorSignupStatus) : undefined;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const signups = await listAmbassadorSignups({
      status: status && ['new', 'added', 'dismissed'].includes(status) ? status : undefined,
      limit: limit && limit <= 200 ? limit : 100,
    });
    return res.status(200).json({ signups });
  } catch (err) {
    console.error('[ambassador-signups]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { insertContributor } from '@/db/campaigns';
import type { ContributorRole } from '@/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAdmin(req, res)) return;

  try {
    const { name, email, phone, instagramHandle, role, vendorId, prospectId } = req.body ?? {};
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!role || !['photographer', 'influencer', 'ambassador', 'repeat_customer', 'referral_leader'].includes(role)) {
      return res.status(400).json({ error: 'role must be one of: photographer, influencer, ambassador, repeat_customer, referral_leader' });
    }

    const contributor = await insertContributor({
      name: name.trim(),
      email: typeof email === 'string' ? email.trim() || undefined : undefined,
      phone: typeof phone === 'string' ? phone.trim() || undefined : undefined,
      instagramHandle: typeof instagramHandle === 'string' ? instagramHandle.trim() || undefined : undefined,
      role: role as ContributorRole,
      vendorId: typeof vendorId === 'string' ? vendorId : undefined,
      prospectId: typeof prospectId === 'string' ? prospectId : undefined,
    });
    return res.status(201).json({ contributor });
  } catch (err) {
    console.error('[campaigns/contributors/create]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
}

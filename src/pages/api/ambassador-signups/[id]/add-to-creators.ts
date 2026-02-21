import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { getAmbassadorSignupById, updateAmbassadorSignupStatus } from '@/db/ambassadorSignups';
import { insertContributor } from '@/db/campaigns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  try {
    const signup = await getAmbassadorSignupById(id);
    if (!signup) {
      return res.status(404).json({ error: 'Signup not found' });
    }
    if (signup.status !== 'new') {
      return res.status(400).json({ error: 'Signup already processed' });
    }

    const contributor = await insertContributor({
      name: signup.name,
      email: signup.email,
      instagramHandle: signup.instagramHandle ?? undefined,
      role: signup.role,
      metadata: signup.city ? { city: signup.city, source: 'ambassador_signup', signupId: signup.id } : { source: 'ambassador_signup', signupId: signup.id },
    });

    await updateAmbassadorSignupStatus(signup.id, 'added', contributor.id);

    return res.status(200).json({ contributor, signup: { ...signup, status: 'added', addedAsContributorId: contributor.id } });
  } catch (err) {
    console.error('[ambassador-signups add-to-creators]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

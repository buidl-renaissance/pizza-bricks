import type { NextApiRequest, NextApiResponse } from 'next';
import { insertAmbassadorSignup } from '@/db/ambassadorSignups';
import type { ContributorRole } from '@/db/schema';

const ROLES: ContributorRole[] = ['photographer', 'influencer', 'ambassador', 'repeat_customer', 'referral_leader'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, city, role, instagramHandle, message } = req.body ?? {};
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!role || !ROLES.includes(role as ContributorRole)) {
      return res.status(400).json({
        error: `role must be one of: ${ROLES.join(', ')}`,
      });
    }

    const signup = await insertAmbassadorSignup({
      name: name.trim(),
      email: email.trim(),
      city: typeof city === 'string' ? city.trim() || undefined : undefined,
      role: role as ContributorRole,
      instagramHandle: typeof instagramHandle === 'string' ? instagramHandle.trim() || undefined : undefined,
      message: typeof message === 'string' ? message.trim() || undefined : undefined,
    });

    return res.status(201).json({ ok: true, id: signup.id });
  } catch (err) {
    console.error('[ambassador-signup]', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

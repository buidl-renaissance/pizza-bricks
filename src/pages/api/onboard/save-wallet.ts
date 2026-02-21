import type { NextApiRequest, NextApiResponse } from 'next';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendorOnboardings, vendors } from '@/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, walletAddress } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required' });
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress is required' });

  const db = getDb();

  const onboarding = await db
    .select()
    .from(vendorOnboardings)
    .where(eq(vendorOnboardings.onboardingToken, token))
    .then(r => r[0] || null);

  if (!onboarding) {
    return res.status(404).json({ error: 'Invalid token' });
  }

  const now = new Date();

  await db.update(vendorOnboardings).set({
    walletAddress,
    status: 'completed',
    walletSetupAt: now,
    completedAt: now,
    updatedAt: now,
  }).where(eq(vendorOnboardings.id, onboarding.id));

  // Mark the vendor as converted
  await db.update(vendors).set({
    status: 'converted',
    updatedAt: now,
  }).where(eq(vendors.id, onboarding.vendorId));

  return res.status(200).json({ success: true, prospectCode: onboarding.prospectCode });
}

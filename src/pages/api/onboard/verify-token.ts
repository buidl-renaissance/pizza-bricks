import type { NextApiRequest, NextApiResponse } from 'next';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendorOnboardings, vendors } from '@/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'token is required' });
  }

  const db = getDb();

  const onboarding = await db
    .select()
    .from(vendorOnboardings)
    .where(eq(vendorOnboardings.onboardingToken, token))
    .then(r => r[0] || null);

  if (!onboarding) {
    return res.status(404).json({ error: 'Invalid or expired onboarding link' });
  }

  if (onboarding.status === 'completed') {
    return res.status(200).json({
      valid: true,
      alreadyCompleted: true,
      prospectCode: onboarding.prospectCode,
      businessName: onboarding.businessName,
      status: onboarding.status,
    });
  }

  // Advance status to 'started' on first visit
  if (onboarding.status === 'pending' || onboarding.status === 'link_sent') {
    await db.update(vendorOnboardings)
      .set({ status: 'started', startedAt: new Date(), updatedAt: new Date() })
      .where(eq(vendorOnboardings.id, onboarding.id));
  }

  const vendor = await db
    .select({ name: vendors.name, email: vendors.email, address: vendors.address })
    .from(vendors)
    .where(eq(vendors.id, onboarding.vendorId))
    .then(r => r[0] || null);

  return res.status(200).json({
    valid: true,
    alreadyCompleted: false,
    id: onboarding.id,
    prospectCode: onboarding.prospectCode,
    status: onboarding.status,
    businessName: onboarding.businessName || vendor?.name,
    contactName: onboarding.contactName,
    preferredEmail: onboarding.preferredEmail || vendor?.email,
    phone: onboarding.phone,
    walletAddress: onboarding.walletAddress,
  });
}

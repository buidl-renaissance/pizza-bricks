import type { NextApiRequest, NextApiResponse } from 'next';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendorOnboardings } from '@/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, contactName, businessName, preferredEmail, phone } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required' });

  const db = getDb();

  const onboarding = await db
    .select()
    .from(vendorOnboardings)
    .where(eq(vendorOnboardings.onboardingToken, token))
    .then(r => r[0] || null);

  if (!onboarding) {
    return res.status(404).json({ error: 'Invalid token' });
  }

  await db.update(vendorOnboardings).set({
    contactName: contactName || onboarding.contactName,
    businessName: businessName || onboarding.businessName,
    preferredEmail: preferredEmail || onboarding.preferredEmail,
    phone: phone || onboarding.phone,
    updatedAt: new Date(),
  }).where(eq(vendorOnboardings.id, onboarding.id));

  return res.status(200).json({ success: true });
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendors } from '@/db/schema';
import { getOrCreateProspectFromVendor } from '@/db/ops';
import { startSiteGenerationForProspect } from '@/lib/agent/workflows/site-generation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { vendorId } = req.body;
    if (!vendorId) {
      return res.status(400).json({ error: 'vendorId is required' });
    }

    const db = getDb();
    const vendor = await db.select().from(vendors)
      .where(eq(vendors.id, vendorId))
      .then(r => r[0] || null);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (!vendor.email) {
      return res.status(400).json({ error: 'Vendor has no email; cannot prepare outreach' });
    }

    const prospect = await getOrCreateProspectFromVendor(vendor);
    const siteId = await startSiteGenerationForProspect(prospect.id);

    return res.status(200).json({
      prospectId: prospect.id,
      siteId,
      status: 'started',
    });
  } catch (err) {
    console.error('Prepare outreach error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

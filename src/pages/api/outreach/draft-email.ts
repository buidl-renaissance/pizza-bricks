import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendors, outreachEmails } from '@/db/schema';
import { inferMenuItems, draftOutreachEmail } from '@/lib/gemini';
import { searchForMenuItems } from '@/lib/customSearch';

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
    let vendor = await db.select().from(vendors)
      .where(eq(vendors.id, vendorId))
      .then(r => r[0] || null);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Fetch menu snippets if not already present
    if (!vendor.recentPosts) {
      const addressParts = vendor.address?.split(',').map(s => s.trim()) || [];
      let city = process.env.OUTREACH_DEFAULT_LOCATION?.split(',')[0]?.trim() || 'Denver';
      if (addressParts.length >= 3) city = addressParts[1];
      else if (addressParts.length === 2) city = addressParts[0];

      const menuSnippets = await searchForMenuItems(vendor.name, city);
      if (menuSnippets.length > 0) {
        await db.update(vendors).set({
          recentPosts: JSON.stringify(menuSnippets),
          updatedAt: new Date(),
        }).where(eq(vendors.id, vendorId));
        vendor = { ...vendor, recentPosts: JSON.stringify(menuSnippets) };
      }
    }

    // Step 1: Infer menu items from reviews + web snippets
    let menuItems = [];
    if (vendor.menuItems) {
      try {
        menuItems = JSON.parse(vendor.menuItems);
      } catch { /* re-infer below */ }
    }

    if (menuItems.length === 0) {
      menuItems = await inferMenuItems(vendor);

      if (menuItems.length > 0) {
        await db.update(vendors).set({
          menuItems: JSON.stringify(menuItems),
          updatedAt: new Date(),
        }).where(eq(vendors.id, vendorId));
      }
    }

    // Step 2: Draft the outreach email
    const { subject, bodyHtml } = await draftOutreachEmail(vendor, menuItems);

    // Step 3: Save as draft in outreach_emails table
    const emailId = uuid();
    await db.insert(outreachEmails).values({
      id: emailId,
      vendorId,
      subject,
      bodyHtml,
      status: 'draft',
    });

    return res.status(200).json({
      emailId,
      subject,
      bodyHtml,
      menuItems,
    });
  } catch (err) {
    console.error('Draft email error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

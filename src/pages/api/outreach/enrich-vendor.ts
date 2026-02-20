import type { NextApiRequest, NextApiResponse } from 'next';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendors } from '@/db/schema';
import { searchForEmail, searchForMenuItems, searchForFacebookPage, searchForInstagram, searchForWebsite } from '@/lib/customSearch';
import { checkWebsiteQuality } from '@/lib/websiteCheck';

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

    const addressParts = vendor.address?.split(',').map(s => s.trim()) || [];
    let city = process.env.OUTREACH_DEFAULT_LOCATION?.split(',')[0]?.trim() || 'Denver';
    if (addressParts.length >= 3) {
      city = addressParts[1];
    } else if (addressParts.length === 2) {
      city = addressParts[0];
    }
    const updates: Record<string, unknown> = {};
    const enrichmentLog: string[] = [];
    let email: string | null = null;

    // Facebook page search
    const fb = await searchForFacebookPage(vendor.name, city);
    if (fb.url) {
      updates.facebookPageUrl = fb.url;
      enrichmentLog.push(`Facebook: ${fb.url}`);
    } else {
      enrichmentLog.push('No Facebook page found');
    }
    if (fb.email) {
      email = fb.email;
      updates.email = email;
      enrichmentLog.push(`Email from Facebook: ${email}`);
    }

    // Instagram search
    const ig = await searchForInstagram(vendor.name, city);
    if (ig.url) {
      updates.instagramUrl = ig.url;
      enrichmentLog.push(`Instagram: ${ig.url}`);
    } else {
      enrichmentLog.push('No Instagram found');
    }
    if (!email && ig.email) {
      email = ig.email;
      updates.email = email;
      enrichmentLog.push(`Email from Instagram: ${email}`);
    }

    // Dedicated email search (if still missing)
    if (!email) {
      const found = await searchForEmail(vendor.name, city);
      if (found) {
        email = found;
        updates.email = email;
        enrichmentLog.push(`Email found: ${email}`);
      } else {
        enrichmentLog.push('No email found');
      }
    }

    // Menu search
    const menuSnippets = await searchForMenuItems(vendor.name, city);
    if (menuSnippets.length > 0) {
      updates.recentPosts = JSON.stringify(menuSnippets);
      enrichmentLog.push(`Found ${menuSnippets.length} menu sources`);
    } else {
      enrichmentLog.push('No menu info found');
    }

    // Discover website via Serper if not known
    if (!vendor.websiteUrl) {
      const discoveredUrl = await searchForWebsite(vendor.name, city);
      if (discoveredUrl) {
        updates.websiteUrl = discoveredUrl;
        updates.hasWebsite = true;
        enrichmentLog.push(`Website discovered: ${discoveredUrl}`);
      }
    }

    // Website quality check
    const webCheck = await checkWebsiteQuality((updates.websiteUrl as string) || vendor.websiteUrl);
    updates.websiteQuality = webCheck.quality;
    enrichmentLog.push(`Website: ${webCheck.quality} [${webCheck.signals.join(', ')}]`);

    // Always write updates
    updates.updatedAt = new Date();
    await db.update(vendors)
      .set(updates)
      .where(eq(vendors.id, vendorId));

    const updatedVendor = await db.select().from(vendors)
      .where(eq(vendors.id, vendorId))
      .then(r => r[0]);

    return res.status(200).json({
      vendor: updatedVendor,
      enrichmentLog,
    });
  } catch (err) {
    console.error('Enrich vendor error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

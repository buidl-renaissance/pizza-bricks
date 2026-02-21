import type { NextApiRequest, NextApiResponse } from 'next';
import { eq, desc, sql } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendorOnboardings, vendors } from '@/db/schema';

/**
 * GET /api/vendor/me?wallet=0x...
 * Returns the vendor and onboarding record for the given wallet address
 * (the wallet they connected during onboarding). Used by the vendor dashboard
 * to show business name, menu, contact info, etc.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const wallet = typeof req.query.wallet === 'string' ? req.query.wallet.trim() : null;
  if (!wallet) return res.status(400).json({ error: 'wallet query is required' });

  const db = getDb();

  const onboarding = await db
    .select()
    .from(vendorOnboardings)
    .where(sql`LOWER(${vendorOnboardings.walletAddress}) = LOWER(${wallet})`)
    .orderBy(desc(vendorOnboardings.completedAt), desc(vendorOnboardings.updatedAt))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!onboarding) {
    // Fallback: return a best-effort vendor profile preview so dashboard has
    // useful content even before a real onboarding row exists.
    const fallbackVendor = await db
      .select()
      .from(vendors)
      .orderBy(
        desc(sql`CASE WHEN ${vendors.menuItems} IS NOT NULL THEN 1 ELSE 0 END`),
        desc(sql`CASE WHEN ${vendors.topReviews} IS NOT NULL THEN 1 ELSE 0 END`),
        desc(vendors.createdAt),
      )
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!fallbackVendor) {
      return res.status(200).json({ vendor: null, onboarding: null, fallback: false });
    }

    type MenuItem = { name: string; description?: string; price?: string };
    type Review = { text: string; rating: number; authorName: string };

    let categories: string[] = [];
    let menuItems: MenuItem[] = [];
    let topReviews: Review[] = [];

    try {
      if (fallbackVendor.categories) categories = JSON.parse(fallbackVendor.categories);
    } catch {}
    try {
      if (fallbackVendor.menuItems) menuItems = JSON.parse(fallbackVendor.menuItems);
    } catch {}
    try {
      if (fallbackVendor.topReviews) topReviews = JSON.parse(fallbackVendor.topReviews);
    } catch {}

    return res.status(200).json({
      onboarding: null,
      fallback: true,
      vendor: {
        name: fallbackVendor.name,
        address: fallbackVendor.address,
        phone: fallbackVendor.phone,
        email: fallbackVendor.email,
        rating: fallbackVendor.rating,
        reviewCount: fallbackVendor.reviewCount,
        categories,
        menuItems,
        topReviews,
        coverPhotoUrl: fallbackVendor.coverPhotoUrl,
        websiteUrl: fallbackVendor.websiteUrl,
      },
    });
  }

  const vendor = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, onboarding.vendorId))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!vendor) {
    return res.status(200).json({
      onboarding: {
        prospectCode: onboarding.prospectCode,
        status: onboarding.status,
        contactName: onboarding.contactName,
        businessName: onboarding.businessName,
        preferredEmail: onboarding.preferredEmail,
        phone: onboarding.phone,
      },
      vendor: null,
    });
  }

  type MenuItem = { name: string; description?: string; price?: string };
  type Review = { text: string; rating: number; authorName: string };

  let categories: string[] = [];
  let menuItems: MenuItem[] = [];
  let topReviews: Review[] = [];

  try {
    if (vendor.categories) categories = JSON.parse(vendor.categories);
  } catch {}
  try {
    if (vendor.menuItems) menuItems = JSON.parse(vendor.menuItems);
  } catch {}
  try {
    if (vendor.topReviews) topReviews = JSON.parse(vendor.topReviews);
  } catch {}

  return res.status(200).json({
    fallback: false,
    onboarding: {
      prospectCode: onboarding.prospectCode,
      status: onboarding.status,
      contactName: onboarding.contactName,
      businessName: onboarding.businessName,
      preferredEmail: onboarding.preferredEmail,
      phone: onboarding.phone,
    },
    vendor: {
      name: vendor.name,
      address: vendor.address,
      phone: vendor.phone,
      email: vendor.email,
      rating: vendor.rating,
      reviewCount: vendor.reviewCount,
      categories,
      menuItems,
      topReviews,
      coverPhotoUrl: vendor.coverPhotoUrl,
      websiteUrl: vendor.websiteUrl,
    },
  });
}

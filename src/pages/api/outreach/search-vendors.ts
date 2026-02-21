import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuid } from 'uuid';
import { eq, like } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendors } from '@/db/schema';
import { geocodeLocation } from '@/lib/geocode';
import { searchGooglePlaces, normalizeGooglePlace, isFoodVendor } from '@/lib/places';
import { searchForEmail, searchForFacebookPage, searchForInstagram, searchForWebsite } from '@/lib/customSearch';
import { checkWebsiteQuality, websiteQualitySortOrder } from '@/lib/websiteCheck';

const MILES_TO_METERS = 1609.34;

/** Coerce empty string to null for unique columns to avoid SQLite issues */
function orNull(v: string | null | undefined): string | null {
  if (v == null || typeof v !== 'string') return null;
  const t = v.trim();
  return t !== '' ? t : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      location = process.env.OUTREACH_DEFAULT_LOCATION || 'Denver, CO',
      keyword = 'food truck',
      radiusMiles = 5,
    } = req.body;

    const radiusMeters = Math.round(radiusMiles * MILES_TO_METERS);
    const center = await geocodeLocation(location);

    const allResults = await searchGooglePlaces(center, keyword, radiusMeters)
      .then(places => places.map(normalizeGooglePlace).filter(isFoodVendor));

    const db = getDb();
    const upserted = [];

    for (const vendor of allResults) {
      let existing = null;

      if (vendor.facebookPageId) {
        existing = await db.select().from(vendors)
          .where(eq(vendors.facebookPageId, vendor.facebookPageId))
          .then(r => r[0] || null);
      }
      if (!existing && vendor.googlePlaceId) {
        existing = await db.select().from(vendors)
          .where(eq(vendors.googlePlaceId, vendor.googlePlaceId))
          .then(r => r[0] || null);
      }

      if (existing) {
        await db.update(vendors)
          .set({
            facebookPageId: orNull(vendor.facebookPageId ?? existing.facebookPageId ?? null),
            facebookPageUrl: vendor.facebookPageUrl || existing.facebookPageUrl,
            googlePlaceId: orNull(vendor.googlePlaceId ?? existing.googlePlaceId ?? null),
            name: vendor.name,
            address: vendor.address || existing.address,
            phone: vendor.phone || existing.phone,
            rating: vendor.rating || existing.rating,
            reviewCount: vendor.reviewCount || existing.reviewCount,
            categories: vendor.categories || existing.categories,
            hasWebsite: vendor.hasWebsite,
            websiteUrl: vendor.websiteUrl || existing.websiteUrl,
            email: vendor.email || existing.email,
            coverPhotoUrl: vendor.coverPhotoUrl || existing.coverPhotoUrl,
            topReviews: vendor.topReviews || existing.topReviews,
            recentPosts: vendor.recentPosts || existing.recentPosts,
            updatedAt: new Date(),
          })
          .where(eq(vendors.id, existing.id));

        upserted.push({ ...existing, ...vendor, id: existing.id });
      } else {
        const id = uuid();
        await db.insert(vendors).values({
          id,
          facebookPageId: orNull(vendor.facebookPageId ?? null),
          facebookPageUrl: vendor.facebookPageUrl || null,
          googlePlaceId: orNull(vendor.googlePlaceId ?? null),
          name: vendor.name,
          address: vendor.address,
          phone: vendor.phone,
          rating: vendor.rating,
          reviewCount: vendor.reviewCount,
          categories: vendor.categories,
          hasWebsite: vendor.hasWebsite,
          websiteUrl: vendor.websiteUrl,
          email: vendor.email || null,
          coverPhotoUrl: vendor.coverPhotoUrl,
          topReviews: vendor.topReviews || null,
          recentPosts: vendor.recentPosts || null,
          status: 'candidate',
        });

        upserted.push({ id, ...vendor, status: 'candidate' });
      }
    }

    // Split into already-enriched (skip) vs needs-enrichment
    const enriched: typeof upserted = [];
    const toEnrich: typeof upserted = [];
    const enrichmentLogs: Record<string, string[]> = {};

    for (const vendor of upserted) {
      const hasEnrichment = vendor.facebookPageUrl || vendor.instagramUrl || vendor.email || vendor.websiteQuality;
      if (hasEnrichment) {
        enrichmentLogs[vendor.name] = ['Cached — skipping enrichment'];
        enriched.push(vendor);
      } else {
        toEnrich.push(vendor);
      }
    }

    // Enrich new vendors in parallel batches of 4
    const BATCH_SIZE = 4;
    for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
      const batch = toEnrich.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (vendor) => {
        const vendorId = vendor.id;
        const addressParts = vendor.address?.split(',').map(s => s.trim()) || [];
        let city = process.env.OUTREACH_DEFAULT_LOCATION?.split(',')[0]?.trim() || 'Denver';
        if (addressParts.length >= 3) {
          city = addressParts[1];
        } else if (addressParts.length === 2) {
          city = addressParts[0];
        }
        const log: string[] = [];

        try {
          const updates: Record<string, unknown> = {};

          // Run social searches in parallel (1 Serper call each)
          const [fb, ig] = await Promise.all([
            searchForFacebookPage(vendor.name, city),
            searchForInstagram(vendor.name, city),
          ]);

          if (fb.url) {
            vendor.facebookPageUrl = fb.url;
            updates.facebookPageUrl = fb.url;
            log.push(`Facebook: ${fb.url}`);
          } else {
            log.push('No Facebook page found');
          }
          if (fb.email) {
            vendor.email = fb.email;
            updates.email = fb.email;
            log.push(`Email from Facebook: ${fb.email}`);
          }

          if (ig.url) {
            vendor.instagramUrl = ig.url;
            updates.instagramUrl = ig.url;
            log.push(`Instagram: ${ig.url}`);
          } else {
            log.push('No Instagram found');
          }
          if (!vendor.email && ig.email) {
            vendor.email = ig.email;
            updates.email = ig.email;
            log.push(`Email from Instagram: ${ig.email}`);
          }

          // Email search only if still missing (1 Serper call)
          if (!vendor.email) {
            const email = await searchForEmail(vendor.name, city);
            if (email) {
              vendor.email = email;
              updates.email = email;
              log.push(`Email found: ${email}`);
            } else {
              log.push('No email found');
            }
          }

          // Website discovery + quality check in parallel
          if (!vendor.websiteUrl) {
            const discoveredUrl = await searchForWebsite(vendor.name, city);
            if (discoveredUrl) {
              vendor.websiteUrl = discoveredUrl;
              vendor.hasWebsite = true;
              updates.websiteUrl = discoveredUrl;
              updates.hasWebsite = true;
              log.push(`Website discovered: ${discoveredUrl}`);
            }
          }

          const webCheck = await checkWebsiteQuality(vendor.websiteUrl || null);
          vendor.websiteQuality = webCheck.quality;
          updates.websiteQuality = webCheck.quality;
          log.push(`Website: ${webCheck.quality} [${webCheck.signals.join(', ')}]`);

          updates.updatedAt = new Date();
          await db.update(vendors).set(updates).where(eq(vendors.id, vendorId));
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          log.push(`ERROR: ${errMsg}`);
          console.error(`Enrichment failed for ${vendor.name}:`, err);
        }

        enrichmentLogs[vendor.name] = log;
        enriched.push(vendor);
      }));
    }

    // Always prepend demo vendors from DB (they never come from Google Places)
    const demoVendors = await db
      .select()
      .from(vendors)
      .where(like(vendors.googlePlaceId, 'demo_%'));

    const enrichedIds = new Set(enriched.map(v => v.id));
    for (const demo of demoVendors) {
      if (!enrichedIds.has(demo.id)) {
        enriched.push(demo);
      }
    }

    // Sort: demo vendors first, then by website quality (none > poor > basic > good), then by rating
    enriched.sort((a, b) => {
      const aIsDemo = a.notes === '__demo__' ? 0 : 1;
      const bIsDemo = b.notes === '__demo__' ? 0 : 1;
      if (aIsDemo !== bIsDemo) return aIsDemo - bIsDemo;
      const aOrder = websiteQualitySortOrder(a.websiteQuality ?? null);
      const bOrder = websiteQualitySortOrder(b.websiteQuality ?? null);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
    });

    const sources = {
      google: allResults.length,
      googleError: null,
    };

    return res.status(200).json({
      vendors: enriched,
      total: enriched.length,
      sources,
      enrichmentLogs,
    });
  } catch (err) {
    console.error('Search vendors error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

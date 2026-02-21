/**
 * Reattaches the vendor (for a given wallet) to the correct prospect and thus
 * to the prospect's generated sites. Use when prospect.metadata.vendorId was
 * lost and the vendor dashboard no longer shows sites for that wallet.
 *
 * Run: npx tsx scripts/reattach-vendor-to-prospect.ts <wallet> [prospectId] [vendorId?]
 * - With onboarding: vendor comes from onboarding; prospectId is optional (auto-picked if one candidate).
 * - No onboarding: pass prospectId and vendorId; script reattaches and creates the onboarding row for the wallet.
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../src/db/drizzle';
import { prospects, vendorOnboardings, vendors, generatedSites } from '../src/db/schema';
import { getProspectByVendorId, updateProspectMetadata, getProspect } from '../src/db/ops';

const WALLET = process.argv[2]?.trim() ?? '';
const PROSPECT_ID_ARG = process.argv[3]?.trim();
const VENDOR_ID_ARG = process.argv[4]?.trim();

async function main() {
  if (!WALLET) {
    console.error('Usage: npx tsx scripts/reattach-vendor-to-prospect.ts <wallet> [prospectId] [vendorId]');
    process.exit(1);
  }

  const db = getDb();

  let onboarding = await db
    .select()
    .from(vendorOnboardings)
    .where(sql`LOWER(${vendorOnboardings.walletAddress}) = LOWER(${WALLET})`)
    .limit(1)
    .then((r) => r[0] ?? null);

  let vendor: typeof vendors.$inferSelect | null = null;

  if (onboarding) {
    vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, onboarding.vendorId))
      .limit(1)
      .then((r) => r[0] ?? null);
    if (!vendor) {
      console.error('Vendor not found for onboarding vendorId:', onboarding.vendorId);
      process.exit(1);
    }
  } else {
    if (!PROSPECT_ID_ARG) {
      console.error('No onboarding record for this wallet. Pass prospectId (and optionally vendorId):');
      console.error('  npx tsx scripts/reattach-vendor-to-prospect.ts <wallet> <prospectId> [vendorId]');
      process.exit(1);
    }
    if (VENDOR_ID_ARG) {
      vendor = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, VENDOR_ID_ARG))
        .limit(1)
        .then((r) => r[0] ?? null);
      if (!vendor) {
        console.error('Vendor not found:', VENDOR_ID_ARG);
        process.exit(1);
      }
    } else {
      const prospect = await getProspect(PROSPECT_ID_ARG);
      if (!prospect) {
        console.error('Prospect not found:', PROSPECT_ID_ARG);
        process.exit(1);
      }
      const byName = await db
        .select()
        .from(vendors)
        .where(sql`LOWER(TRIM(${vendors.name})) = ${(prospect.name ?? '').toLowerCase().trim()}`);
      if (byName.length !== 1) {
        console.error('No onboarding for this wallet and could not infer vendor (need exactly one vendor with same name as prospect). Pass vendorId:');
        console.error('  npx tsx scripts/reattach-vendor-to-prospect.ts', WALLET, PROSPECT_ID_ARG, '<vendorId>');
        process.exit(1);
      }
      vendor = byName[0];
    }
  }

  const existingProspect = await getProspectByVendorId(vendor.id);
  if (onboarding && existingProspect) {
    console.log('Vendor is already linked to prospect:', existingProspect.name, '(id:', existingProspect.id + ')');
    process.exit(0);
  }

  if (PROSPECT_ID_ARG) {
    const prospect = await getProspect(PROSPECT_ID_ARG);
    if (!prospect) {
      console.error('Prospect not found:', PROSPECT_ID_ARG);
      process.exit(1);
    }
    await updateProspectMetadata(prospect.id, { vendorId: vendor.id });
    if (!onboarding) {
      const year = new Date().getFullYear();
      const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
      const prospectCode = `PB-${year}-${suffix}`;
      const onboardingToken = randomUUID().replace(/-/g, '');
      await db.insert(vendorOnboardings).values({
        id: randomUUID(),
        prospectCode,
        vendorId: vendor.id,
        onboardingToken,
        status: 'wallet_setup',
        walletAddress: WALLET,
        businessName: vendor.name,
        preferredEmail: vendor.email ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Created onboarding for wallet; dashboard will now show vendor and sites.');
    }
    console.log('Reattached vendor', vendor.name, 'to prospect', prospect.name, '(id:', prospect.id + ')');
    process.exit(0);
  }

  // Find prospects that have no vendorId in metadata and have at least one generated site
  const withSites = await db
    .select({
      id: prospects.id,
      name: prospects.name,
      metadata: prospects.metadata,
    })
    .from(prospects)
    .innerJoin(generatedSites, eq(generatedSites.prospectId, prospects.id))
    .where(sql`(${prospects.metadata} IS NULL OR json_extract(${prospects.metadata}, '$.vendorId') IS NULL)`);

  const seen = new Set<string>();
  const candidates = withSites.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  if (candidates.length === 0) {
    console.error('No prospect found that has sites and no vendor link. Create a prospect from this vendor first or pass a prospectId.');
    process.exit(1);
  }

  const byName = candidates.filter((c) => c.name?.toLowerCase() === vendor.name?.toLowerCase());
  const chosen = byName.length >= 1 ? byName[0] : candidates[0];

  if (candidates.length > 1 && byName.length !== 1) {
    console.log('Multiple candidate prospects (no exact name match). Picking first. Pass prospectId as second arg to choose.');
    console.log('Candidates:', candidates.map((c) => ({ id: c.id, name: c.name })));
  }

  await updateProspectMetadata(chosen.id, { vendorId: vendor.id });
  console.log('Reattached vendor', vendor.name, 'to prospect', chosen.name, '(id:', chosen.id + '). Sites will now appear for this wallet.');
}

main().catch(console.error).finally(() => process.exit(0));

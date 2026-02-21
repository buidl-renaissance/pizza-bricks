/**
 * Reattaches the vendor (for a given wallet) to the correct prospect and thus
 * to the prospect's generated sites. Use when prospect.metadata.vendorId was
 * lost and the vendor dashboard no longer shows sites for that wallet.
 *
 * Run: npx tsx scripts/reattach-vendor-to-prospect.ts [wallet] [prospectId?]
 * Example: npx tsx scripts/reattach-vendor-to-prospect.ts 0xD1B19C9ce037eD96a4bfaEcCb7cb2CC48F7680Bd
 * If multiple candidate prospects exist, pass the prospect ID as second argument.
 */
import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../src/db/drizzle';
import { prospects, vendorOnboardings, vendors, generatedSites } from '../src/db/schema';
import { getProspectByVendorId, updateProspectMetadata, getProspect } from '../src/db/ops';

const WALLET = process.argv[2]?.trim() ?? '';
const PROSPECT_ID_ARG = process.argv[3]?.trim();

async function main() {
  if (!WALLET) {
    console.error('Usage: npx tsx scripts/reattach-vendor-to-prospect.ts <wallet> [prospectId]');
    process.exit(1);
  }

  const db = getDb();

  const onboarding = await db
    .select()
    .from(vendorOnboardings)
    .where(sql`LOWER(${vendorOnboardings.walletAddress}) = LOWER(${WALLET})`)
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!onboarding) {
    console.error('No onboarding record found for wallet:', WALLET);
    process.exit(1);
  }

  const vendor = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, onboarding.vendorId))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!vendor) {
    console.error('Vendor not found for onboarding vendorId:', onboarding.vendorId);
    process.exit(1);
  }

  const existingProspect = await getProspectByVendorId(vendor.id);
  if (existingProspect) {
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

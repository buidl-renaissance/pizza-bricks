/**
 * Connects a wallet address to an existing vendor and prospect so the vendor
 * dashboard shows that vendor's data when the wallet is connected.
 *
 * Run: npx tsx scripts/connect-wallet-to-vendor.ts [wallet]
 * Default wallet: 0xD1B19C9ce037eD96a4bfaEcCb7cb2CC48F7680Bd
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { eq, like, sql } from 'drizzle-orm';
import { getDb } from '../src/db/drizzle';
import { vendors, vendorOnboardings } from '../src/db/schema';
import { getOrCreateProspectFromVendor } from '../src/db/ops';

const WALLET = process.argv[2] ?? '0xD1B19C9ce037eD96a4bfaEcCb7cb2CC48F7680Bd';

async function main() {
  const db = getDb();
  const wallet = WALLET.trim();

  // Prefer a demo vendor so there's likely existing data; otherwise first vendor
  const demoVendors = await db
    .select()
    .from(vendors)
    .where(like(vendors.googlePlaceId, 'demo_%'))
    .limit(1);

  const allVendors = await db.select().from(vendors).limit(1);
  const vendor = demoVendors[0] ?? allVendors[0];

  if (!vendor) {
    console.error('No vendors in DB. Run seed or add a vendor first.');
    process.exit(1);
  }

  // Ensure prospect exists for this vendor (metadata.vendorId)
  const prospect = await getOrCreateProspectFromVendor(vendor);
  console.log('Vendor:', vendor.name, '(id:', vendor.id + ')');
  console.log('Prospect:', prospect.name, '(id:', prospect.id + ')');

  const existing = await db
    .select()
    .from(vendorOnboardings)
    .where(sql`LOWER(${vendorOnboardings.walletAddress}) = LOWER(${wallet})`)
    .limit(1)
    .then((r) => r[0] ?? null);

  if (existing) {
    if (existing.vendorId === vendor.id) {
      console.log('\n✓ Wallet', wallet, 'is already connected to this vendor.');
      process.exit(0);
    }
    await db
      .update(vendorOnboardings)
      .set({
        vendorId: vendor.id,
        updatedAt: new Date(),
      })
      .where(eq(vendorOnboardings.id, existing.id));
    console.log('\n✓ Updated existing onboarding: wallet now linked to vendor', vendor.name);
    process.exit(0);
  }

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
    walletAddress: wallet,
    businessName: vendor.name,
    preferredEmail: vendor.email || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('\n✓ Connected wallet to vendor and prospect.');
  console.log('  Wallet:     ', wallet);
  console.log('  Vendor:     ', vendor.name);
  console.log('  Prospect:   ', prospect.name);
  console.log('  Prospect code:', prospectCode);
}

main().catch(console.error).finally(() => process.exit(0));

/**
 * Creates a test vendor_onboarding record linked to one of the demo vendors.
 * Run: npx tsx scripts/create-test-onboarding.ts
 *
 * Outputs the onboarding URL you can open in the browser to test the flow.
 */
import 'dotenv/config';
import { getDb } from '../src/db/drizzle';
import { vendors, vendorOnboardings } from '../src/db/schema';
import { like } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function main() {
  const db = getDb();

  // Pick the first demo vendor
  const demoVendors = await db
    .select()
    .from(vendors)
    .where(like(vendors.googlePlaceId, 'demo_%'))
    .limit(1);

  if (demoVendors.length === 0) {
    console.error('No demo vendors found. Run `npm run seed-demo` first.');
    process.exit(1);
  }

  const vendor = demoVendors[0];

  // Check if a test onboarding already exists for this vendor
  const existing = await db
    .select()
    .from(vendorOnboardings)
    .then(rows => rows.find(r => r.vendorId === vendor.id) || null);

  if (existing) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log('\n✓ Onboarding already exists for', vendor.name);
    console.log('  Prospect code:', existing.prospectCode);
    console.log('  Status:       ', existing.status);
    console.log('\n  Test URL:');
    console.log(`  ${baseUrl}/onboard?token=${existing.onboardingToken}\n`);
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
    status: 'link_sent',
    businessName: vendor.name,
    preferredEmail: vendor.email || 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log('\n✓ Test onboarding created for', vendor.name);
  console.log('  Prospect code:', prospectCode);
  console.log('\n  Test URL (open in browser):');
  console.log(`  ${baseUrl}/onboard?token=${onboardingToken}\n`);
}

main().catch(console.error).finally(() => process.exit(0));

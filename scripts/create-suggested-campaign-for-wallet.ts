/**
 * Creates a suggested campaign for the vendor linked to the given wallet.
 *
 * Run: npx tsx scripts/create-suggested-campaign-for-wallet.ts [wallet]
 * Default wallet: 0xD1B19C9ce037eD96a4bfaEcCb7cb2CC48F7680Bd
 */
import 'dotenv/config';
import { desc, sql } from 'drizzle-orm';
import { getDb } from '../src/db/drizzle';
import { vendorOnboardings } from '../src/db/schema';
import { getProspectByVendorId } from '../src/db/ops';
import { insertCampaign } from '../src/db/campaigns';

const WALLET = process.argv[2] ?? '0xD1B19C9ce037eD96a4bfaEcCb7cb2CC48F7680Bd';

async function main() {
  const db = getDb();
  const wallet = WALLET.trim();

  const onboarding = await db
    .select({ vendorId: vendorOnboardings.vendorId })
    .from(vendorOnboardings)
    .where(sql`LOWER(${vendorOnboardings.walletAddress}) = LOWER(${wallet})`)
    .orderBy(desc(vendorOnboardings.completedAt), desc(vendorOnboardings.updatedAt))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!onboarding?.vendorId) {
    console.error('No vendor found for wallet', wallet, '- run connect-wallet-to-vendor first.');
    process.exit(1);
  }

  const vendorId = onboarding.vendorId;
  const prospect = await getProspectByVendorId(vendorId);

  const campaign = await insertCampaign({
    vendorId,
    prospectId: prospect?.id,
    type: 'community_event',
    status: 'suggested',
    name: "Vendor Spotlight Night",
    description: "A community event to showcase your menu and connect with local customers. Great for building buzz and testing new dishes.",
    suggestedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // ~2 weeks out
    suggestedTime: '6:00 PM – 9:00 PM',
    estimatedCost: 10000, // cents
    estimatedReach: 300,
    requiredContributors: 2,
  });

  console.log('\n✓ Suggested campaign created.');
  console.log('  Wallet:   ', wallet);
  console.log('  VendorId: ', vendorId);
  console.log('  ProspectId:', prospect?.id ?? '(none)');
  console.log('  Campaign: ', campaign.name);
  console.log('  Id:       ', campaign.id);
  console.log('  Status:   ', campaign.status);
  console.log('  Date:     ', campaign.suggestedDate);
}

main().catch(console.error).finally(() => process.exit(0));

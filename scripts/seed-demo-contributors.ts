/**
 * Seed script: inserts ~200 signed-up creators (contributors) for matching to campaigns.
 * Run with: yarn seed-demo-contributors (or npx tsx scripts/seed-demo-contributors.ts)
 */
import { config } from 'dotenv';
config({ path: '.env' });

import { getDb } from '../src/db/drizzle';
import { contributors } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { ContributorRole } from '../src/db/schema';

const CITIES = ['Denver', 'Detroit', 'Austin', 'Chicago'] as const;
const ROLES: ContributorRole[] = ['photographer', 'influencer', 'ambassador'];

const FIRST_NAMES = [
  'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Reese', 'Skyler', 'Parker',
  'Jamie', 'Dakota', 'Cameron', 'Alex', 'Sam', 'Drew', 'Blake', 'Kendall', 'Hayden', 'Emery',
  'Finley', 'River', 'Phoenix', 'Sage', 'Rowan', 'Charlie', 'Frankie', 'Harper', 'Emerson', 'Ellis',
];

const LAST_NAMES = [
  'Chen', 'Martinez', 'Kim', 'Patel', 'Nguyen', 'Garcia', 'Thompson', 'Williams', 'Brown', 'Jones',
  'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Clark',
];

function generateContributors(count: number): Array<{
  name: string;
  email: string;
  instagramHandle: string | null;
  role: ContributorRole;
  city: string;
}> {
  const out: Array<{ name: string; email: string; instagramHandle: string | null; role: ContributorRole; city: string }> = [];
  for (let i = 1; i <= count; i++) {
    const first = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const last = LAST_NAMES[(i - 1) % LAST_NAMES.length];
    const name = `${first} ${last}`;
    const email = `creator-${i}@example.com`;
    const instagramHandle = i % 3 === 0 ? `@creator_${i}` : null;
    const role = ROLES[(i - 1) % ROLES.length];
    const city = CITIES[(i - 1) % CITIES.length];
    out.push({ name, email, instagramHandle, role, city });
  }
  return out;
}

const SEED_CONTRIBUTORS = generateContributors(200);

async function main() {
  const db = getDb();
  let inserted = 0;
  let skipped = 0;

  for (const c of SEED_CONTRIBUTORS) {
    const existing = await db
      .select()
      .from(contributors)
      .where(eq(contributors.email, c.email))
      .then((r) => r[0] ?? null);

    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(contributors).values({
      id: uuid(),
      vendorId: null,
      prospectId: null,
      name: c.name,
      email: c.email,
      phone: null,
      instagramHandle: c.instagramHandle,
      role: c.role,
      metadata: JSON.stringify({ city: c.city, source: 'seed' }),
    });

    inserted++;
    if (inserted % 50 === 0) console.log(`  ... ${inserted} inserted`);
  }

  console.log(`\nDone — ${inserted} inserted, ${skipped} skipped (seed-demo-contributors).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

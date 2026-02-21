import 'dotenv/config';
import { getDb } from '../src/db/drizzle';
import { outreachEmails, emailReplies, vendorOnboardings, vendors } from '../src/db/schema';
import { like } from 'drizzle-orm';

async function main() {
  const db = getDb();

  await db.delete(vendorOnboardings);
  console.log('✓ Cleared vendor_onboardings');

  await db.delete(emailReplies);
  console.log('✓ Cleared email_replies');

  await db.delete(outreachEmails);
  console.log('✓ Cleared outreach_emails');

  await db.update(vendors).set({ status: 'candidate', notes: null, updatedAt: new Date() });
  console.log('✓ Reset all vendor statuses → candidate');

  await db.update(vendors)
    .set({ notes: '__demo__' })
    .where(like(vendors.googlePlaceId, 'demo_%'));
  console.log('✓ Restored demo vendor notes flag');
}

main().catch(console.error).finally(() => process.exit(0));

/**
 * Fixes DB so "yarn db:push" succeeds.
 * - Creates missing unique indexes on email_replies (fixes "no such index: email_replies_resendMessageId_unique").
 * - If email_replies is missing resendMessageId, runs full 0006 migration (outreach_emails columns + email_replies recreate + indexes).
 *
 * Uses the same DB as drizzle (USE_LOCAL / TURSO_*). Run from app-blocks/pizza-bricks:
 *   yarn db:fix-indexes
 */
import 'dotenv/config';
import path from 'path';
import { existsSync } from 'fs';
import { createClient } from '@libsql/client';

function getLocalDbPath(): string {
  const cwd = process.cwd();
  const inMonorepo = path.join(cwd, 'app-blocks', 'pizza-bricks', 'package.json');
  const dbDir = existsSync(inMonorepo) ? path.join(cwd, 'app-blocks', 'pizza-bricks') : cwd;
  return path.join(dbDir, 'dev.sqlite3');
}

async function runMigration0006(client: ReturnType<typeof createClient>) {
  console.log('Applying migration 0006 (outreach_emails + email_replies)...');

  // outreach_emails: add Resend columns (ignore if already exist)
  for (const col of ['resendMessageId', 'sentRfcMessageId']) {
    try {
      await client.execute(`ALTER TABLE outreach_emails ADD COLUMN ${col} text`);
      console.log('  outreach_emails: added', col);
    } catch {
      // column already exists
    }
  }

  // email_replies: recreate with resendMessageId
  await client.execute(`
    CREATE TABLE email_replies_new (
      id text PRIMARY KEY NOT NULL,
      outreachEmailId text REFERENCES outreach_emails(id),
      vendorId text NOT NULL REFERENCES vendors(id),
      gmailMessageId text,
      gmailThreadId text,
      resendMessageId text,
      rfcMessageId text,
      fromEmail text NOT NULL,
      subject text,
      bodyText text NOT NULL,
      receivedAt integer NOT NULL,
      intent text,
      intentConfidence text,
      intentSummary text,
      analyzedAt integer,
      createdAt integer DEFAULT (strftime('%s', 'now')) NOT NULL
    )
  `);
  await client.execute(`
    INSERT INTO email_replies_new (id, outreachEmailId, vendorId, gmailMessageId, gmailThreadId, resendMessageId, rfcMessageId, fromEmail, subject, bodyText, receivedAt, intent, intentConfidence, intentSummary, analyzedAt, createdAt)
    SELECT id, outreachEmailId, vendorId, gmailMessageId, gmailThreadId, NULL, rfcMessageId, fromEmail, subject, bodyText, receivedAt, intent, intentConfidence, intentSummary, analyzedAt, createdAt FROM email_replies
  `);
  await client.execute('DROP TABLE email_replies');
  await client.execute('ALTER TABLE email_replies_new RENAME TO email_replies');
  await client.execute('CREATE UNIQUE INDEX email_replies_gmailMessageId_unique ON email_replies (gmailMessageId)');
  await client.execute('CREATE UNIQUE INDEX email_replies_resendMessageId_unique ON email_replies (resendMessageId)');
  console.log('  email_replies: recreated with resendMessageId and indexes');
}

async function main() {
  const useLocal = process.env.USE_LOCAL === 'true';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const url = useLocal || !authToken
    ? `file:${getLocalDbPath()}`
    : process.env.TURSO_DATABASE_URL!;

  const client = createClient(
    useLocal || !authToken
      ? { url }
      : { url, authToken: authToken ?? '' }
  );

  const indexStatements = [
    'CREATE UNIQUE INDEX IF NOT EXISTS email_replies_gmailMessageId_unique ON email_replies (gmailMessageId)',
    'CREATE UNIQUE INDEX IF NOT EXISTS email_replies_resendMessageId_unique ON email_replies (resendMessageId)',
  ];

  let needFullMigration = false;
  for (const sql of indexStatements) {
    try {
      await client.execute(sql);
      console.log('OK:', sql.split(' ON ')[0]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('no such column') && msg.includes('resendMessageId')) {
        needFullMigration = true;
        break;
      }
      throw e;
    }
  }

  if (needFullMigration) {
    await runMigration0006(client);
  }

  console.log('Done. You can run yarn db:push now.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

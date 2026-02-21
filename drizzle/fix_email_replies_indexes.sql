-- Fixes: SQLite error "no such index: email_replies_resendMessageId_unique" when running yarn db:push
-- Use this when email_replies already has resendMessageId column but the unique indexes are missing.
--
-- Turso: turso db shell YOUR_DB_NAME < drizzle/fix_email_replies_indexes.sql
-- Local: sqlite3 dev.sqlite3 < drizzle/fix_email_replies_indexes.sql
--
-- If you get "no such column: resendMessageId", run the full migration 0006_resend_outreach.sql
-- (or use USE_LOCAL=true and run migrations locally first).
CREATE UNIQUE INDEX IF NOT EXISTS email_replies_gmailMessageId_unique ON email_replies (gmailMessageId);
CREATE UNIQUE INDEX IF NOT EXISTS email_replies_resendMessageId_unique ON email_replies (resendMessageId);

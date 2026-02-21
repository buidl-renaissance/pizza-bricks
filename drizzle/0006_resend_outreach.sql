-- Add Resend fields to outreach_emails
ALTER TABLE outreach_emails ADD COLUMN resendMessageId text;
--> statement-breakpoint
ALTER TABLE outreach_emails ADD COLUMN sentRfcMessageId text;
--> statement-breakpoint
-- Add resendMessageId to email_replies and make gmailMessageId/gmailThreadId nullable (SQLite: recreate table)
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
);
--> statement-breakpoint
INSERT INTO email_replies_new (id, outreachEmailId, vendorId, gmailMessageId, gmailThreadId, resendMessageId, rfcMessageId, fromEmail, subject, bodyText, receivedAt, intent, intentConfidence, intentSummary, analyzedAt, createdAt)
SELECT id, outreachEmailId, vendorId, gmailMessageId, gmailThreadId, NULL, rfcMessageId, fromEmail, subject, bodyText, receivedAt, intent, intentConfidence, intentSummary, analyzedAt, createdAt FROM email_replies;
--> statement-breakpoint
DROP TABLE email_replies;
--> statement-breakpoint
ALTER TABLE email_replies_new RENAME TO email_replies;
--> statement-breakpoint
CREATE UNIQUE INDEX email_replies_gmailMessageId_unique ON email_replies (gmailMessageId);
--> statement-breakpoint
CREATE UNIQUE INDEX email_replies_resendMessageId_unique ON email_replies (resendMessageId);

-- Track Resend send-event status on outreach_emails (email.sent, delivered, bounced, failed)
ALTER TABLE outreach_emails ADD COLUMN deliveryStatus text;
--> statement-breakpoint
ALTER TABLE outreach_emails ADD COLUMN deliveryStatusAt integer;
--> statement-breakpoint
ALTER TABLE outreach_emails ADD COLUMN deliveryDetails text;

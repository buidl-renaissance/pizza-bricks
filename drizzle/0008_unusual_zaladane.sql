DROP INDEX "email_replies_gmailMessageId_unique";--> statement-breakpoint
DROP INDEX "email_replies_resendMessageId_unique";--> statement-breakpoint
DROP INDEX "users_renaissanceId_unique";--> statement-breakpoint
DROP INDEX "users_phone_unique";--> statement-breakpoint
DROP INDEX "vendor_onboardings_prospectCode_unique";--> statement-breakpoint
DROP INDEX "vendor_onboardings_onboardingToken_unique";--> statement-breakpoint
DROP INDEX "vendors_facebookPageId_unique";--> statement-breakpoint
DROP INDEX "vendors_googlePlaceId_unique";--> statement-breakpoint
ALTER TABLE `email_replies` ALTER COLUMN "gmailMessageId" TO "gmailMessageId" text;--> statement-breakpoint
CREATE UNIQUE INDEX `email_replies_gmailMessageId_unique` ON `email_replies` (`gmailMessageId`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_replies_resendMessageId_unique` ON `email_replies` (`resendMessageId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_renaissanceId_unique` ON `users` (`renaissanceId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `vendor_onboardings_prospectCode_unique` ON `vendor_onboardings` (`prospectCode`);--> statement-breakpoint
CREATE UNIQUE INDEX `vendor_onboardings_onboardingToken_unique` ON `vendor_onboardings` (`onboardingToken`);--> statement-breakpoint
CREATE UNIQUE INDEX `vendors_facebookPageId_unique` ON `vendors` (`facebookPageId`);--> statement-breakpoint
CREATE UNIQUE INDEX `vendors_googlePlaceId_unique` ON `vendors` (`googlePlaceId`);--> statement-breakpoint
ALTER TABLE `email_replies` ALTER COLUMN "gmailThreadId" TO "gmailThreadId" text;--> statement-breakpoint
ALTER TABLE `email_replies` ADD `resendMessageId` text;--> statement-breakpoint
ALTER TABLE `outreach_emails` ADD `resendMessageId` text;--> statement-breakpoint
ALTER TABLE `outreach_emails` ADD `sentRfcMessageId` text;--> statement-breakpoint
ALTER TABLE `outreach_emails` ADD `deliveryStatus` text;--> statement-breakpoint
ALTER TABLE `outreach_emails` ADD `deliveryStatusAt` integer;--> statement-breakpoint
ALTER TABLE `outreach_emails` ADD `deliveryDetails` text;
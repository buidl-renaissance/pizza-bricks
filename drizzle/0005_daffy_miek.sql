CREATE TABLE `agent_ticks` (
	`id` text PRIMARY KEY NOT NULL,
	`startedAt` integer NOT NULL,
	`completedAt` integer,
	`discovered` integer DEFAULT 0 NOT NULL,
	`emailsSent` integer DEFAULT 0 NOT NULL,
	`followUpsSent` integer DEFAULT 0 NOT NULL,
	`inputTokens` integer DEFAULT 0 NOT NULL,
	`outputTokens` integer DEFAULT 0 NOT NULL,
	`estimatedCostUsd` text,
	`outflowTxHash` text,
	`outflowAmountUsdc` text,
	`status` text DEFAULT 'completed' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agentic_costs` (
	`id` text PRIMARY KEY NOT NULL,
	`operation` text NOT NULL,
	`entityType` text,
	`entityId` text,
	`model` text NOT NULL,
	`inputTokens` integer NOT NULL,
	`outputTokens` integer NOT NULL,
	`estimatedCostUsd` text NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `email_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`outreachEmailId` text,
	`vendorId` text NOT NULL,
	`gmailMessageId` text NOT NULL,
	`gmailThreadId` text NOT NULL,
	`rfcMessageId` text,
	`fromEmail` text NOT NULL,
	`subject` text,
	`bodyText` text NOT NULL,
	`receivedAt` integer NOT NULL,
	`intent` text,
	`intentConfidence` text,
	`intentSummary` text,
	`analyzedAt` integer,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`outreachEmailId`) REFERENCES `outreach_emails`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_replies_gmailMessageId_unique` ON `email_replies` (`gmailMessageId`);--> statement-breakpoint
CREATE TABLE `vendor_onboardings` (
	`id` text PRIMARY KEY NOT NULL,
	`prospectCode` text NOT NULL,
	`vendorId` text NOT NULL,
	`emailReplyId` text,
	`onboardingToken` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`contactName` text,
	`businessName` text,
	`preferredEmail` text,
	`phone` text,
	`walletAddress` text,
	`feeTxHash` text,
	`feePaidAt` integer,
	`linkSentAt` integer,
	`startedAt` integer,
	`walletSetupAt` integer,
	`completedAt` integer,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`emailReplyId`) REFERENCES `email_replies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vendor_onboardings_prospectCode_unique` ON `vendor_onboardings` (`prospectCode`);--> statement-breakpoint
CREATE UNIQUE INDEX `vendor_onboardings_onboardingToken_unique` ON `vendor_onboardings` (`onboardingToken`);--> statement-breakpoint
ALTER TABLE `campaigns` ADD `inputTokens` integer;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `outputTokens` integer;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `estimatedCostUsd` text;--> statement-breakpoint
ALTER TABLE `generated_sites` ADD `inputTokens` integer;--> statement-breakpoint
ALTER TABLE `generated_sites` ADD `outputTokens` integer;--> statement-breakpoint
ALTER TABLE `generated_sites` ADD `estimatedCostUsd` text;--> statement-breakpoint
ALTER TABLE `outreach_emails` ADD `gmailThreadId` text;
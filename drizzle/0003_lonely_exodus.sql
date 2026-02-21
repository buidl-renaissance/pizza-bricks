CREATE TABLE `campaign_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`campaignId` text NOT NULL,
	`campaignEventId` text,
	`revenue` integer,
	`footTraffic` integer,
	`socialReach` integer,
	`newFollowers` integer,
	`conversionLift` text,
	`metadata` text,
	`recordedAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`campaignEventId`) REFERENCES `campaign_events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `campaign_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`campaignId` text NOT NULL,
	`assetType` text NOT NULL,
	`url` text,
	`content` text,
	`metadata` text,
	`createdAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `campaign_contributor_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`campaignId` text NOT NULL,
	`contributorId` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`invitedAt` integer,
	`respondedAt` integer,
	`createdAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contributorId`) REFERENCES `contributors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `campaign_events` (
	`id` text PRIMARY KEY NOT NULL,
	`campaignId` text NOT NULL,
	`publishedEventId` integer,
	`rsvpUrl` text,
	`qrImageUrl` text,
	`sourceId` text,
	`sourceUrl` text,
	`metadata` text,
	`createdAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `campaign_outreach` (
	`id` text PRIMARY KEY NOT NULL,
	`campaignId` text NOT NULL,
	`contributorId` text,
	`channel` text NOT NULL,
	`recipient` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`subject` text,
	`bodyHtml` text,
	`bodyText` text,
	`sentAt` integer,
	`metadata` text,
	`createdAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contributorId`) REFERENCES `contributors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`vendorId` text,
	`prospectId` text,
	`type` text NOT NULL,
	`status` text DEFAULT 'suggested' NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`suggestedDate` text,
	`suggestedTime` text,
	`estimatedCost` integer,
	`estimatedReach` integer,
	`requiredContributors` integer,
	`budget` integer,
	`timeline` text,
	`assetList` text,
	`underutilizationInsight` text,
	`metadata` text,
	`createdAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prospectId`) REFERENCES `prospects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `contributors` (
	`id` text PRIMARY KEY NOT NULL,
	`vendorId` text,
	`prospectId` text,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`instagramHandle` text,
	`role` text NOT NULL,
	`metadata` text,
	`lastInvitedAt` integer,
	`createdAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prospectId`) REFERENCES `prospects`(`id`) ON UPDATE no action ON DELETE no action
);

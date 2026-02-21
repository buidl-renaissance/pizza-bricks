CREATE TABLE `outreach_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`vendorId` text NOT NULL,
	`subject` text NOT NULL,
	`bodyHtml` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`gmailMessageId` text,
	`sentAt` integer,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`facebookPageId` text,
	`facebookPageUrl` text,
	`instagramUrl` text,
	`googlePlaceId` text,
	`name` text NOT NULL,
	`address` text,
	`phone` text,
	`rating` text,
	`reviewCount` integer,
	`categories` text,
	`hasWebsite` integer DEFAULT false NOT NULL,
	`websiteUrl` text,
	`websiteQuality` text,
	`email` text,
	`coverPhotoUrl` text,
	`topReviews` text,
	`menuItems` text,
	`recentPosts` text,
	`status` text DEFAULT 'candidate' NOT NULL,
	`notes` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vendors_facebookPageId_unique` ON `vendors` (`facebookPageId`);--> statement-breakpoint
CREATE UNIQUE INDEX `vendors_googlePlaceId_unique` ON `vendors` (`googlePlaceId`);--> statement-breakpoint
ALTER TABLE `email_logs` ADD `messageId` text;
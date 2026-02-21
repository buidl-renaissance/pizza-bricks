CREATE TABLE `ambassador_signups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`city` text,
	`role` text NOT NULL,
	`instagramHandle` text,
	`message` text,
	`status` text DEFAULT 'new' NOT NULL,
	`addedAsContributorId` text,
	`createdAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`addedAsContributorId`) REFERENCES `contributors`(`id`) ON UPDATE no action ON DELETE no action
);

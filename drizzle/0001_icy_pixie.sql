CREATE TABLE `activity_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`prospectId` text,
	`targetLabel` text,
	`detail` text,
	`status` text DEFAULT 'completed' NOT NULL,
	`triggeredBy` text DEFAULT 'agent' NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `agent_state` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'paused' NOT NULL,
	`currentWorkflows` text,
	`lastHeartbeat` integer,
	`config` text,
	`pausedBy` text,
	`pausedAt` integer
);
--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`prospectId` text NOT NULL,
	`templateId` text NOT NULL,
	`sequenceStep` integer DEFAULT 1 NOT NULL,
	`subject` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`sentAt` integer,
	`openedAt` integer,
	`repliedAt` integer,
	`bounceReason` text
);
--> statement-breakpoint
CREATE TABLE `generated_sites` (
	`id` text PRIMARY KEY NOT NULL,
	`prospectId` text NOT NULL,
	`url` text,
	`status` text DEFAULT 'generating' NOT NULL,
	`templateType` text,
	`includes` text,
	`generatedAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`publishedAt` integer,
	`viewCount` integer DEFAULT 0 NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `prospects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'other' NOT NULL,
	`contactName` text,
	`email` text,
	`phone` text,
	`address` text,
	`city` text,
	`source` text DEFAULT 'manual',
	`pipelineStage` text DEFAULT 'discovered' NOT NULL,
	`discoveredAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`lastActivityAt` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`metadata` text
);

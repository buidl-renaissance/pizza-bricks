-- Add AI cost columns to generated_sites
ALTER TABLE `generated_sites` ADD COLUMN `inputTokens` integer;
ALTER TABLE `generated_sites` ADD COLUMN `outputTokens` integer;
ALTER TABLE `generated_sites` ADD COLUMN `estimatedCostUsd` text;

-- Add AI cost columns to campaigns
ALTER TABLE `campaigns` ADD COLUMN `inputTokens` integer;
ALTER TABLE `campaigns` ADD COLUMN `outputTokens` integer;
ALTER TABLE `campaigns` ADD COLUMN `estimatedCostUsd` text;

-- Agentic costs: one row per Anthropic API call
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

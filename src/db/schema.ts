import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ── Ops / Growth Agent Types ──────────────────────────────────────────────────
export type ProspectType = 'pizzeria'|'food_truck'|'catering'|'restaurant'|'bakery'|'deli'|'other';
export type ProspectSource = 'yelp'|'google_maps'|'directory'|'manual'|'referral';
export type PipelineStage = 'discovered'|'contacted'|'engaged'|'onboarding'|'converted'|'churned';
export type ActivityEventType =
  | 'email_sent'|'email_opened'|'email_replied'|'email_bounced'
  | 'site_generated'|'site_published'|'site_viewed'|'prospect_discovered'|'prospect_batch_scraped'
  | 'onboarding_started'|'wallet_setup'|'onboarding_completed'|'follow_up_triggered'
  | 'manual_action'|'agent_error';
export type ActivityEventStatus = 'completed'|'active'|'pending'|'failed';
export type TriggeredBy = 'agent'|'manual'|'system';
export type EmailStatus = 'queued'|'sent'|'delivered'|'opened'|'replied'|'bounced'|'failed';
export type GeneratedSiteStatus = 'generating'|'pending_review'|'published'|'revision_requested'|'archived';
export type AgentStatus = 'running'|'paused'|'error';

// User roles
export type UserRole = 'user' | 'organizer' | 'admin';

// User status enum values
export const USER_STATUSES = ['active', 'inactive', 'banned'] as const;
export type UserStatus = typeof USER_STATUSES[number];

// Users table
// ── Ops Tables ────────────────────────────────────────────────────────────────
export const prospects = sqliteTable('prospects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').$type<ProspectType>().notNull().default('other'),
  contactName: text('contactName'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  source: text('source').$type<ProspectSource>().default('manual'),
  pipelineStage: text('pipelineStage').$type<PipelineStage>().notNull().default('discovered'),
  discoveredAt: integer('discoveredAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
  lastActivityAt: integer('lastActivityAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
  metadata: text('metadata'), // JSON
});

export const activityEvents = sqliteTable('activity_events', {
  id: text('id').primaryKey(),
  type: text('type').$type<ActivityEventType>().notNull(),
  prospectId: text('prospectId'),       // nullable FK
  targetLabel: text('targetLabel'),
  detail: text('detail'),
  status: text('status').$type<ActivityEventStatus>().notNull().default('completed'),
  triggeredBy: text('triggeredBy').$type<TriggeredBy>().notNull().default('agent'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
  metadata: text('metadata'), // JSON — append-only, never update/delete
});

export const emailLogs = sqliteTable('email_logs', {
  id: text('id').primaryKey(),
  prospectId: text('prospectId').notNull(),
  templateId: text('templateId').notNull(),
  sequenceStep: integer('sequenceStep').notNull().default(1),
  subject: text('subject').notNull(),
  status: text('status').$type<EmailStatus>().notNull().default('queued'),
  sentAt: integer('sentAt', { mode: 'timestamp' }),
  openedAt: integer('openedAt', { mode: 'timestamp' }),
  repliedAt: integer('repliedAt', { mode: 'timestamp' }),
  bounceReason: text('bounceReason'),
});

export const generatedSites = sqliteTable('generated_sites', {
  id: text('id').primaryKey(),
  prospectId: text('prospectId').notNull(),
  url: text('url'),
  status: text('status').$type<GeneratedSiteStatus>().notNull().default('generating'),
  templateType: text('templateType'),
  includes: text('includes'),  // JSON array
  generatedAt: integer('generatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
  publishedAt: integer('publishedAt', { mode: 'timestamp' }),
  viewCount: integer('viewCount').default(0).notNull(),
  metadata: text('metadata'), // JSON: { deploymentId, vercelProjectId }
});

export const agentState = sqliteTable('agent_state', {
  id: text('id').primaryKey(),   // always 'singleton'
  status: text('status').$type<AgentStatus>().notNull().default('paused'),
  currentWorkflows: text('currentWorkflows'), // JSON
  lastHeartbeat: integer('lastHeartbeat', { mode: 'timestamp' }),
  config: text('config'), // JSON: { discoveryEnabled, emailEnabled, siteGenEnabled, emailRatePerHour, maxProspectsPerTick }
  pausedBy: text('pausedBy').$type<'admin'|'system'|'error'>(),
  pausedAt: integer('pausedAt', { mode: 'timestamp' }),
});

// ── Users Table ───────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  renaissanceId: text('renaissanceId').unique(), // Renaissance app user ID
  phone: text('phone').unique(), // Primary login method
  email: text('email'), // Optional
  username: text('username'),
  name: text('name'), // Display name
  pfpUrl: text('pfpUrl'), // Profile picture URL
  displayName: text('displayName'), // App-specific name (editable)
  profilePicture: text('profilePicture'), // App-specific profile picture (editable)
  accountAddress: text('accountAddress'), // Wallet address
  pinHash: text('pinHash'), // bcrypt hash of 4-digit PIN
  failedPinAttempts: integer('failedPinAttempts').default(0), // Failed PIN attempts counter
  lockedAt: integer('lockedAt', { mode: 'timestamp' }), // Timestamp when account was locked
  status: text('status').$type<UserStatus>().default('active'), // User status: active, inactive, banned
  role: text('role').$type<UserRole>().default('user').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

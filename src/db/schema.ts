import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ── Ops / Growth Agent Types ──────────────────────────────────────────────────
export type ProspectType = 'pizzeria'|'food_truck'|'catering'|'restaurant'|'bakery'|'deli'|'other';
export type ProspectSource = 'yelp'|'google_maps'|'directory'|'manual'|'referral';
export type PipelineStage = 'discovered'|'contacted'|'engaged'|'onboarding'|'converted'|'churned';
export type ActivityEventType =
  | 'email_sent'|'email_opened'|'email_replied'|'email_bounced'
  | 'site_generated'|'site_published'|'site_updated'|'site_viewed'|'prospect_discovered'|'prospect_batch_scraped'
  | 'onboarding_started'|'wallet_setup'|'onboarding_completed'|'follow_up_triggered'
  | 'marketing_materials_requested'|'event_influencer_requested'|'reply_intent_parsed'
  | 'campaign_suggested'|'campaign_activated'|'campaign_outreach_sent'|'campaign_analytics_recorded'
  | 'manual_action'|'agent_error';
export type ActivityEventStatus = 'completed'|'active'|'pending'|'failed';
export type TriggeredBy = 'agent'|'manual'|'system';
export type EmailLogStatus = 'queued'|'sent'|'delivered'|'opened'|'replied'|'bounced'|'failed';
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
  status: text('status').$type<EmailLogStatus>().notNull().default('queued'),
  sentAt: integer('sentAt', { mode: 'timestamp' }),
  openedAt: integer('openedAt', { mode: 'timestamp' }),
  repliedAt: integer('repliedAt', { mode: 'timestamp' }),
  bounceReason: text('bounceReason'),
  messageId: text('messageId'), // Resend email id or RFC Message-ID for thread matching
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

// Vendor outreach status
export const VENDOR_STATUSES = [
  'candidate',   // discovered, not yet contacted
  'contacted',   // initial email sent
  'replied',     // vendor replied (AI not yet analyzed or not interested)
  'onboarding',  // AI confirmed interest, follow-up + prospect link sent
  'converted',   // completed onboarding
  'dismissed',   // not a fit / unsubscribed
] as const;
export type VendorStatus = typeof VENDOR_STATUSES[number];

// Vendors table — businesses discovered via Facebook Graph API and/or Google Places API
export const vendors = sqliteTable('vendors', {
  id: text('id').primaryKey(),
  // Source IDs — nullable since a vendor may exist in only one source
  facebookPageId: text('facebookPageId').unique(),
  facebookPageUrl: text('facebookPageUrl'),
  instagramUrl: text('instagramUrl'),
  googlePlaceId: text('googlePlaceId').unique(),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  rating: text('rating'), // stored as text e.g. "4.5"
  reviewCount: integer('reviewCount'),
  categories: text('categories'), // JSON: string[]
  hasWebsite: integer('hasWebsite', { mode: 'boolean' }).default(false).notNull(),
  websiteUrl: text('websiteUrl'),
  websiteQuality: text('websiteQuality'), // 'none' | 'poor' | 'basic' | 'good' | null
  email: text('email'), // from Facebook emails field, Custom Search, or manual entry
  coverPhotoUrl: text('coverPhotoUrl'), // direct image URL (Facebook cover or Google Places photo)
  topReviews: text('topReviews'), // JSON: { text, rating, authorName, publishTime }[]
  menuItems: text('menuItems'), // JSON: { name, description, price? }[] — inferred by Gemini
  recentPosts: text('recentPosts'), // JSON: { message, createdTime }[] — from Facebook page feed
  status: text('status').$type<VendorStatus>().default('candidate').notNull(),
  notes: text('notes'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Outreach email status
export const EMAIL_STATUSES = ['draft', 'sent', 'bounced'] as const;
export type OutreachEmailStatus = typeof EMAIL_STATUSES[number];

// Outreach emails table — log of drafted and sent emails
export const outreachEmails = sqliteTable('outreach_emails', {
  id: text('id').primaryKey(),
  vendorId: text('vendorId').notNull().references(() => vendors.id),
  subject: text('subject').notNull(),
  bodyHtml: text('bodyHtml').notNull(),
  status: text('status').$type<OutreachEmailStatus>().default('draft').notNull(),
  gmailMessageId: text('gmailMessageId'), // set after successful send
  gmailThreadId: text('gmailThreadId'),   // Gmail thread ID — used to match replies
  sentAt: integer('sentAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// ── Onboarding Flow ───────────────────────────────────────────────────────────

// AI interest analysis result
export type ReplyIntent = 'interested' | 'not_interested' | 'needs_follow_up' | 'unclear';

// email_replies — vendor responses captured from Gmail inbox polling
export const emailReplies = sqliteTable('email_replies', {
  id: text('id').primaryKey(),
  outreachEmailId: text('outreachEmailId').references(() => outreachEmails.id),
  vendorId: text('vendorId').notNull().references(() => vendors.id),
  gmailMessageId: text('gmailMessageId').unique().notNull(),
  gmailThreadId: text('gmailThreadId').notNull(),
  // RFC 2822 Message-ID header (e.g. "<CABcde...@mail.gmail.com>") — used for In-Reply-To / References
  rfcMessageId: text('rfcMessageId'),
  fromEmail: text('fromEmail').notNull(),
  subject: text('subject'),
  bodyText: text('bodyText').notNull(),          // plain-text of vendor's reply
  receivedAt: integer('receivedAt', { mode: 'timestamp' }).notNull(),
  // AI analysis fields
  intent: text('intent').$type<ReplyIntent>(),   // result of AI classification
  intentConfidence: text('intentConfidence'),     // e.g. "0.92"
  intentSummary: text('intentSummary'),           // one-line AI reasoning
  analyzedAt: integer('analyzedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Onboarding status progression
export const ONBOARDING_STATUSES = [
  'pending',       // AI confirmed interest, record created
  'link_sent',     // follow-up email with onboarding link dispatched
  'started',       // vendor opened their onboarding page
  'wallet_setup',  // vendor connected or created wallet
  'completed',     // all onboarding steps done
  'abandoned',     // vendor stopped mid-flow
] as const;
export type OnboardingStatus = typeof ONBOARDING_STATUSES[number];

// vendor_onboardings — one record per vendor once interest is confirmed
export const vendorOnboardings = sqliteTable('vendor_onboardings', {
  id: text('id').primaryKey(),
  // Human-readable prospect code, e.g. "PB-2025-A3F7"
  prospectCode: text('prospectCode').unique().notNull(),
  vendorId: text('vendorId').notNull().references(() => vendors.id),
  // The reply that triggered this onboarding
  emailReplyId: text('emailReplyId').references(() => emailReplies.id),
  // Secure token embedded in the onboarding link, e.g. /onboard?token=...
  onboardingToken: text('onboardingToken').unique().notNull(),
  status: text('status').$type<OnboardingStatus>().default('pending').notNull(),
  // Vendor contact info captured during onboarding
  contactName: text('contactName'),
  businessName: text('businessName'),
  preferredEmail: text('preferredEmail'),
  phone: text('phone'),
  // Wallet set up during onboarding
  walletAddress: text('walletAddress'),
  // ERC-8021 onboarding fee paid on Base
  feeTxHash: text('feeTxHash'),
  feePaidAt: integer('feePaidAt', { mode: 'timestamp' }),
  // Timeline
  linkSentAt: integer('linkSentAt', { mode: 'timestamp' }),
  startedAt: integer('startedAt', { mode: 'timestamp' }),
  walletSetupAt: integer('walletSetupAt', { mode: 'timestamp' }),
  completedAt: integer('completedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// ── Agent Ticks — one row per autonomous agent run ────────────────────────────
export const agentTicks = sqliteTable('agent_ticks', {
  id: text('id').primaryKey(),
  startedAt: integer('startedAt', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completedAt', { mode: 'timestamp' }),
  // Workflow results
  discovered: integer('discovered').default(0).notNull(),
  emailsSent: integer('emailsSent').default(0).notNull(),
  followUpsSent: integer('followUpsSent').default(0).notNull(),
  // AI cost tracking
  inputTokens: integer('inputTokens').default(0).notNull(),
  outputTokens: integer('outputTokens').default(0).notNull(),
  estimatedCostUsd: text('estimatedCostUsd'),  // e.g. "0.002300"
  // Autonomous on-chain spend (proves self-sustaining outflow)
  outflowTxHash: text('outflowTxHash'),
  outflowAmountUsdc: text('outflowAmountUsdc'),
  status: text('status').notNull().default('completed'), // 'completed' | 'failed'
});

// ── Convenience types ─────────────────────────────────────────────────────────
export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
export type OutreachEmail = typeof outreachEmails.$inferSelect;
export type NewOutreachEmail = typeof outreachEmails.$inferInsert;

// ── Campaign Orchestrator ─────────────────────────────────────────────────────
export type CampaignType =
  | 'community_event'      // Pizza Party / Community Event
  | 'contributor_driven'   // Photographer Night, Creator Night
  | 'growth_milestone'     // 1000 Followers Unlock, Truck to Brick
  | 'referral_rally';      // Referral links, ambassador competition

export type CampaignStatus = 'suggested' | 'active' | 'completed' | 'cancelled';

export type ContributorRole = 'photographer' | 'influencer' | 'ambassador' | 'repeat_customer' | 'referral_leader';

export type ContributorInviteStatus = 'pending' | 'accepted' | 'declined';

export type OutreachChannel = 'dm' | 'email' | 'sms';

export type OutreachStatus = 'draft' | 'pending_approval' | 'sent' | 'failed';

export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  vendorId: text('vendorId').references(() => vendors.id),
  prospectId: text('prospectId').references(() => prospects.id),
  type: text('type').$type<CampaignType>().notNull(),
  status: text('status').$type<CampaignStatus>().notNull().default('suggested'),
  name: text('name').notNull(),
  description: text('description'),
  suggestedDate: text('suggestedDate'), // ISO date string
  suggestedTime: text('suggestedTime'),
  estimatedCost: integer('estimatedCost'), // cents
  estimatedReach: integer('estimatedReach'),
  requiredContributors: integer('requiredContributors'),
  budget: integer('budget'), // cents
  timeline: text('timeline'), // JSON: { days, phases }
  assetList: text('assetList'), // JSON: string[]
  underutilizationInsight: text('underutilizationInsight'),
  metadata: text('metadata'), // JSON
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
});

export const campaignEvents = sqliteTable('campaign_events', {
  id: text('id').primaryKey(),
  campaignId: text('campaignId').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  publishedEventId: integer('publishedEventId'), // renaissance-events event id
  rsvpUrl: text('rsvpUrl'),
  qrImageUrl: text('qrImageUrl'),
  sourceId: text('sourceId'), // Original ID in pizza-bricks
  sourceUrl: text('sourceUrl'), // URL to view in pizza-bricks
  metadata: text('metadata'), // JSON
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
});

export const contributors = sqliteTable('contributors', {
  id: text('id').primaryKey(),
  vendorId: text('vendorId').references(() => vendors.id),
  prospectId: text('prospectId').references(() => prospects.id),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  instagramHandle: text('instagramHandle'),
  role: text('role').$type<ContributorRole>().notNull(),
  metadata: text('metadata'), // JSON: reach, follower count, etc.
  lastInvitedAt: integer('lastInvitedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
});

export const campaignContributorInvites = sqliteTable('campaign_contributor_invites', {
  id: text('id').primaryKey(),
  campaignId: text('campaignId').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  contributorId: text('contributorId').notNull().references(() => contributors.id, { onDelete: 'cascade' }),
  role: text('role').$type<ContributorRole>().notNull(),
  status: text('status').$type<ContributorInviteStatus>().notNull().default('pending'),
  invitedAt: integer('invitedAt', { mode: 'timestamp' }),
  respondedAt: integer('respondedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
});

export const campaignAssets = sqliteTable('campaign_assets', {
  id: text('id').primaryKey(),
  campaignId: text('campaignId').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  assetType: text('assetType').notNull(), // poster, ig_post, rsvp_page, qr_image
  url: text('url'),
  content: text('content'), // Plain text for IG post drafts, etc.
  metadata: text('metadata'), // JSON
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
});

export const campaignOutreach = sqliteTable('campaign_outreach', {
  id: text('id').primaryKey(),
  campaignId: text('campaignId').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  contributorId: text('contributorId').references(() => contributors.id),
  channel: text('channel').$type<OutreachChannel>().notNull(),
  recipient: text('recipient').notNull(), // email, phone, or handle
  status: text('status').$type<OutreachStatus>().notNull().default('draft'),
  subject: text('subject'), // for email
  bodyHtml: text('bodyHtml'),
  bodyText: text('bodyText'),
  sentAt: integer('sentAt', { mode: 'timestamp' }),
  metadata: text('metadata'), // JSON
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
});

export const campaignAnalytics = sqliteTable('campaign_analytics', {
  id: text('id').primaryKey(),
  campaignId: text('campaignId').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  campaignEventId: text('campaignEventId').references(() => campaignEvents.id),
  revenue: integer('revenue'), // cents
  footTraffic: integer('footTraffic'),
  socialReach: integer('socialReach'),
  newFollowers: integer('newFollowers'),
  conversionLift: text('conversionLift'), // e.g. "15%"
  metadata: text('metadata'), // JSON
  recordedAt: integer('recordedAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type CampaignEvent = typeof campaignEvents.$inferSelect;
export type NewCampaignEvent = typeof campaignEvents.$inferInsert;
export type Contributor = typeof contributors.$inferSelect;
export type NewContributor = typeof contributors.$inferInsert;
export type CampaignContributorInvite = typeof campaignContributorInvites.$inferSelect;
export type NewCampaignContributorInvite = typeof campaignContributorInvites.$inferInsert;
export type CampaignAsset = typeof campaignAssets.$inferSelect;
export type NewCampaignAsset = typeof campaignAssets.$inferInsert;
export type CampaignOutreach = typeof campaignOutreach.$inferSelect;
export type NewCampaignOutreach = typeof campaignOutreach.$inferInsert;
export type CampaignAnalytic = typeof campaignAnalytics.$inferSelect;
export type NewCampaignAnalytic = typeof campaignAnalytics.$inferInsert;

// ── Ambassador recruiting (public signups) ────────────────────────────────────
export type AmbassadorSignupStatus = 'new' | 'added' | 'dismissed';

export const ambassadorSignups = sqliteTable('ambassador_signups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  city: text('city'),
  role: text('role').$type<ContributorRole>().notNull(),
  instagramHandle: text('instagramHandle'),
  message: text('message'), // optional "why" or notes
  status: text('status').$type<AmbassadorSignupStatus>().notNull().default('new'),
  addedAsContributorId: text('addedAsContributorId').references(() => contributors.id),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s','now'))`).notNull(),
});

export type AmbassadorSignup = typeof ambassadorSignups.$inferSelect;
export type NewAmbassadorSignup = typeof ambassadorSignups.$inferInsert;

export type EmailReply = typeof emailReplies.$inferSelect;
export type NewEmailReply = typeof emailReplies.$inferInsert;
export type VendorOnboarding = typeof vendorOnboardings.$inferSelect;
export type NewVendorOnboarding = typeof vendorOnboardings.$inferInsert;

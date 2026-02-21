import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './drizzle';
import {
  campaigns,
  campaignEvents,
  contributors,
  campaignContributorInvites,
  campaignAssets,
  campaignOutreach,
  campaignAnalytics,
  vendors,
  prospects,
} from './schema';
import type {
  CampaignType,
  CampaignStatus,
  ContributorRole,
  ContributorInviteStatus,
  OutreachChannel,
  OutreachStatus,
} from './schema';

export type Campaign = typeof campaigns.$inferSelect;
export type Contributor = typeof contributors.$inferSelect;

// ── Campaigns ─────────────────────────────────────────────────────────────────
export async function insertCampaign(data: {
  vendorId?: string;
  prospectId?: string;
  type: CampaignType;
  status?: CampaignStatus;
  name: string;
  description?: string;
  suggestedDate?: string;
  suggestedTime?: string;
  estimatedCost?: number;
  estimatedReach?: number;
  requiredContributors?: number;
  budget?: number;
  timeline?: string;
  assetList?: string[];
  underutilizationInsight?: string;
  metadata?: Record<string, unknown>;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: string;
}): Promise<Campaign> {
  const db = getDb();
  const id = uuidv4();
  const row = {
    id,
    vendorId: data.vendorId ?? null,
    prospectId: data.prospectId ?? null,
    type: data.type,
    status: data.status ?? 'suggested',
    name: data.name,
    description: data.description ?? null,
    suggestedDate: data.suggestedDate ?? null,
    suggestedTime: data.suggestedTime ?? null,
    estimatedCost: data.estimatedCost ?? null,
    estimatedReach: data.estimatedReach ?? null,
    requiredContributors: data.requiredContributors ?? null,
    budget: data.budget ?? null,
    timeline: data.timeline ?? null,
    assetList: data.assetList ? JSON.stringify(data.assetList) : null,
    underutilizationInsight: data.underutilizationInsight ?? null,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    inputTokens: data.inputTokens ?? null,
    outputTokens: data.outputTokens ?? null,
    estimatedCostUsd: data.estimatedCostUsd ?? null,
  };
  await db.insert(campaigns).values(row);
  return row as Campaign;
}

export async function getCampaign(id: string) {
  const db = getDb();
  const rows = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return rows[0];
}

export async function listCampaigns(opts: {
  status?: CampaignStatus;
  vendorId?: string;
  prospectId?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const db = getDb();
  const { status, vendorId, prospectId, limit = 50, offset = 0 } = opts;
  const conditions = [];
  if (status) conditions.push(eq(campaigns.status, status));
  if (vendorId) conditions.push(eq(campaigns.vendorId, vendorId));
  if (prospectId) conditions.push(eq(campaigns.prospectId, prospectId));
  const query = db.select().from(campaigns)
    .orderBy(desc(campaigns.createdAt))
    .limit(limit)
    .offset(offset);
  if (conditions.length > 0) return query.where(and(...conditions));
  return query;
}

export async function updateCampaign(id: string, data: Partial<{
  status: CampaignStatus;
  name: string;
  description: string;
  suggestedDate: string;
  suggestedTime: string;
  budget: number;
  metadata: Record<string, unknown>;
}>) {
  const db = getDb();
  const update: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.metadata !== undefined) update.metadata = JSON.stringify(data.metadata);
  await db.update(campaigns).set(update).where(eq(campaigns.id, id));
}

// ── Campaign Events ───────────────────────────────────────────────────────────
export async function insertCampaignEvent(data: {
  campaignId: string;
  publishedEventId?: number;
  rsvpUrl?: string;
  qrImageUrl?: string;
  sourceId?: string;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  const id = uuidv4();
  const row = {
    id,
    campaignId: data.campaignId,
    publishedEventId: data.publishedEventId ?? null,
    rsvpUrl: data.rsvpUrl ?? null,
    qrImageUrl: data.qrImageUrl ?? null,
    sourceId: data.sourceId ?? null,
    sourceUrl: data.sourceUrl ?? null,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  };
  await db.insert(campaignEvents).values(row);
  return row;
}

export async function getCampaignEventByCampaignId(campaignId: string) {
  const db = getDb();
  const rows = await db.select().from(campaignEvents)
    .where(eq(campaignEvents.campaignId, campaignId))
    .orderBy(desc(campaignEvents.createdAt))
    .limit(1);
  return rows[0];
}

/** Derive campaign city from metadata, linked vendor address, or linked prospect city. */
export async function getCampaignCity(campaignId: string): Promise<string | null> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) return null;
  const meta = campaign.metadata ? (JSON.parse(campaign.metadata) as Record<string, unknown>) : null;
  const metaCity = meta && typeof meta.city === 'string' ? meta.city.trim() : null;
  if (metaCity) return metaCity;
  const db = getDb();
  if (campaign.vendorId) {
    const rows = await db.select({ address: vendors.address }).from(vendors).where(eq(vendors.id, campaign.vendorId)).limit(1);
    const addr = rows[0]?.address;
    if (addr) {
      const parts = addr.split(',').map((s: string) => s.trim());
      if (parts.length >= 2) return parts[parts.length - 2];
    }
  }
  if (campaign.prospectId) {
    const rows = await db.select({ city: prospects.city }).from(prospects).where(eq(prospects.id, campaign.prospectId)).limit(1);
    const city = rows[0]?.city;
    if (city) return city;
  }
  return null;
}

/** Contributors eligible for a campaign: have email, optional city match, not already invited/outreach. */
export async function listContributorsForCampaign(campaignId: string): Promise<Contributor[]> {
  const db = getDb();
  const campaignCity = await getCampaignCity(campaignId);
  const all = await db.select().from(contributors)
    .orderBy(desc(contributors.createdAt))
    .limit(1000);
  const withEmail = all.filter((c) => c.email && c.email.trim().length > 0);

  const existingOutreach = await db.select({ contributorId: campaignOutreach.contributorId }).from(campaignOutreach)
    .where(eq(campaignOutreach.campaignId, campaignId));
  const existingInvites = await db.select({ contributorId: campaignContributorInvites.contributorId }).from(campaignContributorInvites)
    .where(eq(campaignContributorInvites.campaignId, campaignId));
  const excludedIds = new Set<string>();
  for (const r of existingOutreach) {
    if (r.contributorId) excludedIds.add(r.contributorId);
  }
  for (const r of existingInvites) {
    excludedIds.add(r.contributorId);
  }

  const eligible = withEmail.filter((c) => {
    if (excludedIds.has(c.id)) return false;
    if (!campaignCity) return true;
    if (!c.metadata) return false;
    try {
      const meta = JSON.parse(c.metadata) as Record<string, unknown>;
      const city = meta?.city;
      if (typeof city !== 'string') return false;
      return city.trim().toLowerCase() === campaignCity.trim().toLowerCase();
    } catch {
      return false;
    }
  });

  return eligible;
}

// ── Contributors ──────────────────────────────────────────────────────────────
export async function insertContributor(data: {
  vendorId?: string;
  prospectId?: string;
  name: string;
  email?: string;
  phone?: string;
  instagramHandle?: string;
  role: ContributorRole;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  const id = uuidv4();
  const row = {
    id,
    vendorId: data.vendorId ?? null,
    prospectId: data.prospectId ?? null,
    name: data.name,
    email: data.email ?? null,
    phone: data.phone ?? null,
    instagramHandle: data.instagramHandle ?? null,
    role: data.role,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  };
  await db.insert(contributors).values(row);
  return row as Contributor;
}

export async function listContributors(opts: {
  vendorId?: string;
  prospectId?: string;
  role?: ContributorRole;
  limit?: number;
  offset?: number;
} = {}) {
  const db = getDb();
  const { vendorId, prospectId, role, limit = 100, offset = 0 } = opts;
  const conditions = [];
  if (vendorId) conditions.push(eq(contributors.vendorId, vendorId));
  if (prospectId) conditions.push(eq(contributors.prospectId, prospectId));
  if (role) conditions.push(eq(contributors.role, role));
  const query = db.select().from(contributors)
    .orderBy(desc(contributors.createdAt))
    .limit(limit)
    .offset(offset);
  if (conditions.length > 0) return query.where(and(...conditions));
  return query;
}

export async function getContributorCountsByRole(vendorId?: string, prospectId?: string) {
  const all = await listContributors({ vendorId, prospectId, limit: 1000 });
  const counts: Record<ContributorRole, number> = {
    photographer: 0,
    influencer: 0,
    ambassador: 0,
    repeat_customer: 0,
    referral_leader: 0,
  };
  for (const c of all) {
    counts[c.role]++;
  }
  return counts;
}

// ── Campaign Contributor Invites ──────────────────────────────────────────────
export async function insertCampaignContributorInvite(data: {
  campaignId: string;
  contributorId: string;
  role: ContributorRole;
  status?: ContributorInviteStatus;
}) {
  const db = getDb();
  const id = uuidv4();
  await db.insert(campaignContributorInvites).values({
    id,
    campaignId: data.campaignId,
    contributorId: data.contributorId,
    role: data.role,
    status: data.status ?? 'pending',
  });
  return id;
}

// ── Campaign Assets ───────────────────────────────────────────────────────────
export async function insertCampaignAsset(data: {
  campaignId: string;
  assetType: string;
  url?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  const id = uuidv4();
  await db.insert(campaignAssets).values({
    id,
    campaignId: data.campaignId,
    assetType: data.assetType,
    url: data.url ?? null,
    content: data.content ?? null,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  });
  return id;
}

export async function listCampaignAssets(campaignId: string) {
  const db = getDb();
  return db.select().from(campaignAssets)
    .where(eq(campaignAssets.campaignId, campaignId))
    .orderBy(desc(campaignAssets.createdAt));
}

// ── Campaign Outreach ─────────────────────────────────────────────────────────
export async function insertCampaignOutreach(data: {
  campaignId: string;
  contributorId?: string;
  channel: OutreachChannel;
  recipient: string;
  status?: OutreachStatus;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
}): Promise<string> {
  const db = getDb();
  const id = uuidv4();
  await db.insert(campaignOutreach).values({
    id,
    campaignId: data.campaignId,
    contributorId: data.contributorId ?? null,
    channel: data.channel,
    recipient: data.recipient,
    status: data.status ?? 'draft',
    subject: data.subject ?? null,
    bodyHtml: data.bodyHtml ?? null,
    bodyText: data.bodyText ?? null,
  });
  return id;
}

export async function getCampaignOutreach(id: string) {
  const db = getDb();
  const rows = await db.select().from(campaignOutreach).where(eq(campaignOutreach.id, id)).limit(1);
  return rows[0];
}

export async function updateCampaignOutreach(
  id: string,
  data: Partial<{ status: OutreachStatus; sentAt: Date }>
) {
  const db = getDb();
  const update: Record<string, unknown> = { updatedAt: new Date(), ...data };
  await db.update(campaignOutreach).set(update).where(eq(campaignOutreach.id, id));
}

export async function listCampaignOutreachByCampaign(campaignId: string) {
  const db = getDb();
  return db.select().from(campaignOutreach)
    .where(eq(campaignOutreach.campaignId, campaignId))
    .orderBy(desc(campaignOutreach.createdAt));
}

// ── Campaign Analytics ────────────────────────────────────────────────────────
export async function insertCampaignAnalytic(data: {
  campaignId: string;
  campaignEventId?: string;
  revenue?: number;
  footTraffic?: number;
  socialReach?: number;
  newFollowers?: number;
  conversionLift?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const db = getDb();
  const id = uuidv4();
  await db.insert(campaignAnalytics).values({
    id,
    campaignId: data.campaignId,
    campaignEventId: data.campaignEventId ?? null,
    revenue: data.revenue ?? null,
    footTraffic: data.footTraffic ?? null,
    socialReach: data.socialReach ?? null,
    newFollowers: data.newFollowers ?? null,
    conversionLift: data.conversionLift ?? null,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  });
  return id;
}

export async function listCampaignAnalytics(campaignId: string) {
  const db = getDb();
  return db.select().from(campaignAnalytics)
    .where(eq(campaignAnalytics.campaignId, campaignId))
    .orderBy(desc(campaignAnalytics.recordedAt));
}

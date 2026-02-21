import { eq, desc, and, sql, count, inArray, isNull, like, sum } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './drizzle';
import {
  prospects,
  activityEvents,
  emailLogs,
  generatedSites,
  agentState,
  agentTicks,
  vendorOnboardings,
  agenticCosts,
} from './schema';
import type {
  PipelineStage,
  ProspectType,
  ProspectSource,
  ActivityEventType,
  ActivityEventStatus,
  TriggeredBy,
  EmailLogStatus,
  GeneratedSiteStatus,
  AgentStatus,
  AgenticCostOperation,
  AgenticCostEntityType,
} from './schema';
import type { Vendor } from './schema';

export type AgentTick = typeof agentTicks.$inferSelect;
import { broadcastActivity } from '@/lib/sse-broadcast';

// ── Types ────────────────────────────────────────────────────────────────────
export type Prospect = typeof prospects.$inferSelect;
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type EmailLog = typeof emailLogs.$inferSelect;
export type GeneratedSite = typeof generatedSites.$inferSelect;
export type AgentStateRow = typeof agentState.$inferSelect;

// ── Prospects ────────────────────────────────────────────────────────────────
export async function insertProspect(data: {
  name: string;
  type?: ProspectType;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  source?: ProspectSource;
  pipelineStage?: PipelineStage;
  metadata?: Record<string, unknown>;
}): Promise<Prospect> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date();
  const row = {
    id,
    name: data.name,
    type: data.type ?? 'other' as ProspectType,
    contactName: data.contactName ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    address: data.address ?? null,
    city: data.city ?? null,
    source: data.source ?? 'manual' as ProspectSource,
    pipelineStage: data.pipelineStage ?? 'discovered' as PipelineStage,
    discoveredAt: now,
    lastActivityAt: now,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  };
  await db.insert(prospects).values(row);
  return row;
}

export async function getProspect(id: string): Promise<Prospect | undefined> {
  const db = getDb();
  const rows = await db.select().from(prospects).where(eq(prospects.id, id)).limit(1);
  return rows[0];
}

export async function listProspects(opts: {
  stage?: PipelineStage;
  type?: ProspectType;
  limit?: number;
  offset?: number;
} = {}): Promise<Prospect[]> {
  const db = getDb();
  const { stage, type, limit = 50, offset = 0 } = opts;
  const conditions = [];
  if (stage) conditions.push(eq(prospects.pipelineStage, stage));
  if (type) conditions.push(eq(prospects.type, type));
  const query = db.select().from(prospects)
    .orderBy(desc(prospects.lastActivityAt))
    .limit(limit)
    .offset(offset);
  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function updateProspectStage(id: string, stage: PipelineStage): Promise<void> {
  const db = getDb();
  await db.update(prospects)
    .set({ pipelineStage: stage, lastActivityAt: new Date() })
    .where(eq(prospects.id, id));
}

export async function touchProspect(id: string): Promise<void> {
  const db = getDb();
  await db.update(prospects)
    .set({ lastActivityAt: new Date() })
    .where(eq(prospects.id, id));
}

export async function getPipelineSummary(): Promise<{ stage: PipelineStage; count: number }[]> {
  const db = getDb();
  const rows = await db.select({
    stage: prospects.pipelineStage,
    count: count(),
  }).from(prospects).groupBy(prospects.pipelineStage);
  return rows.map(r => ({ stage: r.stage as PipelineStage, count: Number(r.count) }));
}

/** Find prospect by vendorId stored in metadata. */
export async function getProspectByVendorId(vendorId: string): Promise<Prospect | undefined> {
  const db = getDb();
  const rows = await db.select().from(prospects)
    .where(sql`json_extract(${prospects.metadata}, '$.vendorId') = ${vendorId}`)
    .limit(1);
  return rows[0];
}

/** Map vendor categories to ProspectType. */
function vendorCategoriesToProspectType(categories: string | null): ProspectType {
  if (!categories) return 'other';
  let raw: string[];
  try {
    raw = JSON.parse(categories) as string[];
  } catch {
    return 'other';
  }
  const lower = raw.join(' ').toLowerCase();
  if (lower.includes('food truck') || lower.includes('food_truck')) return 'food_truck';
  if (lower.includes('restaurant')) return 'restaurant';
  if (lower.includes('pizzeria') || lower.includes('pizza')) return 'pizzeria';
  if (lower.includes('catering')) return 'catering';
  if (lower.includes('bakery')) return 'bakery';
  if (lower.includes('deli')) return 'deli';
  return 'other';
}

/** Extract city from address string (e.g. "123 Main St, Detroit, MI"). */
function extractCityFromAddress(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split(',').map(s => s.trim());
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] ?? null;
}

/** Get or create a prospect from a vendor (outreach flow). Links via metadata.vendorId. */
export async function getOrCreateProspectFromVendor(vendor: Vendor): Promise<Prospect> {
  const existing = await getProspectByVendorId(vendor.id);
  if (existing) return existing;

  const city = extractCityFromAddress(vendor.address ?? null);
  const type = vendorCategoriesToProspectType(vendor.categories);

  return insertProspect({
    name: vendor.name,
    type,
    email: vendor.email ?? undefined,
    phone: vendor.phone ?? undefined,
    address: vendor.address ?? undefined,
    city: city ?? undefined,
    source: 'google_maps',
    pipelineStage: 'discovered',
    metadata: { vendorId: vendor.id },
  });
}

/** Most recent published or pending_review site for a prospect. */
export async function getLatestPublishedSiteForProspect(prospectId: string): Promise<GeneratedSite | undefined> {
  const sites = await listGeneratedSites({ prospectId, limit: 10 });
  return sites.find(s => s.status === 'published' || s.status === 'pending_review');
}

// ── Activity Events ───────────────────────────────────────────────────────────
export async function insertActivityEvent(data: {
  type: ActivityEventType;
  prospectId?: string;
  targetLabel?: string;
  detail?: string;
  status?: ActivityEventStatus;
  triggeredBy?: TriggeredBy;
  metadata?: Record<string, unknown>;
}): Promise<ActivityEvent> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date();
  const row = {
    id,
    type: data.type,
    prospectId: data.prospectId ?? null,
    targetLabel: data.targetLabel ?? null,
    detail: data.detail ?? null,
    status: data.status ?? 'completed' as ActivityEventStatus,
    triggeredBy: data.triggeredBy ?? 'agent' as TriggeredBy,
    createdAt: now,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  };
  await db.insert(activityEvents).values(row);
  broadcastActivity(row);
  return row;
}

export async function listActivityEvents(opts: {
  type?: ActivityEventType;
  triggeredBy?: TriggeredBy;
  limit?: number;
  offset?: number;
} = {}): Promise<ActivityEvent[]> {
  const db = getDb();
  const { type, triggeredBy, limit = 50, offset = 0 } = opts;
  const conditions = [];
  if (type) conditions.push(eq(activityEvents.type, type));
  if (triggeredBy) conditions.push(eq(activityEvents.triggeredBy, triggeredBy));
  const query = db.select().from(activityEvents)
    .orderBy(desc(activityEvents.createdAt))
    .limit(limit)
    .offset(offset);
  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function getRecentActivityEvents(limit = 5): Promise<ActivityEvent[]> {
  const db = getDb();
  return db.select().from(activityEvents)
    .orderBy(desc(activityEvents.createdAt))
    .limit(limit);
}

// ── Email Logs ────────────────────────────────────────────────────────────────
export async function insertEmailLog(data: {
  prospectId: string;
  templateId: string;
  sequenceStep?: number;
  subject: string;
  status?: EmailLogStatus;
  messageId?: string | null;
}): Promise<EmailLog> {
  const db = getDb();
  const id = uuidv4();
  const row = {
    id,
    prospectId: data.prospectId,
    templateId: data.templateId,
    sequenceStep: data.sequenceStep ?? 1,
    subject: data.subject,
    status: data.status ?? 'queued' as EmailLogStatus,
    sentAt: null,
    openedAt: null,
    repliedAt: null,
    bounceReason: null,
    messageId: data.messageId ?? null,
  };
  await db.insert(emailLogs).values(row);
  return row;
}

export async function getEmailLog(id: string): Promise<EmailLog | undefined> {
  const db = getDb();
  const rows = await db.select().from(emailLogs).where(eq(emailLogs.id, id)).limit(1);
  return rows[0];
}

export async function getEmailLogByMessageId(messageId: string): Promise<EmailLog | undefined> {
  const db = getDb();
  const rows = await db.select().from(emailLogs).where(eq(emailLogs.messageId, messageId)).limit(1);
  return rows[0];
}

/** Update email log with Resend message id (e.g. after send). */
export async function updateEmailLogMessageId(id: string, messageId: string): Promise<void> {
  const db = getDb();
  await db.update(emailLogs).set({ messageId }).where(eq(emailLogs.id, id));
}

/**
 * Find the best-matching email log for an inbound reply.
 * 1) If inReplyTo is provided, try to match by messageId (exact or contained in inReplyTo).
 * 2) If from equals SIMULATOR_INBOX, match most recent sent unreplied log by subject (simulator mode).
 * 3) Else match by reply sender (prospect email) and subject; return most recent sent, unreplied log.
 */
export async function findEmailLogForInboundReply(opts: {
  from: string;
  subject: string;
  inReplyTo?: string | null;
}): Promise<EmailLog | undefined> {
  const db = getDb();
  const { from, subject, inReplyTo } = opts;
  const simulatorInbox = process.env.SIMULATOR_INBOX ?? null;

  if (inReplyTo) {
    const normalized = inReplyTo.replace(/^<|>$/g, '').trim();
    const byId = await getEmailLogByMessageId(normalized);
    if (byId) return byId;
    const rows = await db.select().from(emailLogs)
      .where(like(emailLogs.messageId, `%${normalized}%`))
      .orderBy(desc(emailLogs.sentAt))
      .limit(1);
    if (rows[0]) return rows[0];
  }

  if (simulatorInbox && from === simulatorInbox) {
    const subjStripped = subject.replace(/^re:\s*/i, '').trim().toLowerCase();
    const rows = await db.select().from(emailLogs)
      .where(and(
        isNull(emailLogs.repliedAt),
        sql`${emailLogs.sentAt} IS NOT NULL`,
      ))
      .orderBy(desc(emailLogs.sentAt))
      .limit(10);
    for (const log of rows) {
      const logSubj = log.subject.toLowerCase();
      if (subjStripped.includes(logSubj) || logSubj.includes(subjStripped)) return log;
    }
    if (rows[0]) return rows[0];
  }

  const rows = await db.select({ log: emailLogs })
    .from(emailLogs)
    .innerJoin(prospects, eq(emailLogs.prospectId, prospects.id))
    .where(and(
      sql`LOWER(${prospects.email}) = ${from}`,
      isNull(emailLogs.repliedAt),
      sql`${emailLogs.sentAt} IS NOT NULL`,
    ))
    .orderBy(desc(emailLogs.sentAt))
    .limit(5);
  const subjLower = subject.toLowerCase();
  for (const { log } of rows) {
    if (subjLower.includes(log.subject.toLowerCase()) || log.subject.toLowerCase().includes(subjLower.replace(/^re:\s*/i, '').trim())) {
      return log;
    }
  }
  return rows[0]?.log;
}

export async function updateEmailLogStatus(id: string, status: EmailLogStatus, extra?: {
  sentAt?: Date;
  openedAt?: Date;
  repliedAt?: Date;
  bounceReason?: string;
}): Promise<void> {
  const db = getDb();
  await db.update(emailLogs).set({ status, ...extra }).where(eq(emailLogs.id, id));
}

export async function getEmailLogsByProspect(prospectId: string): Promise<EmailLog[]> {
  const db = getDb();
  return db.select().from(emailLogs)
    .where(eq(emailLogs.prospectId, prospectId))
    .orderBy(desc(emailLogs.sentAt));
}

/** Most recent sent email log for this prospect that has not been replied to. */
export async function getLatestUnrepliedEmailLogForProspect(prospectId: string): Promise<EmailLog | undefined> {
  const db = getDb();
  const rows = await db.select().from(emailLogs)
    .where(and(
      eq(emailLogs.prospectId, prospectId),
      isNull(emailLogs.repliedAt),
      sql`${emailLogs.sentAt} IS NOT NULL`,
    ))
    .orderBy(desc(emailLogs.sentAt))
    .limit(1);
  return rows[0];
}

export async function getEmailStats(): Promise<{
  total: number;
  sent: number;
  opened: number;
  replied: number;
  bounced: number;
}> {
  const db = getDb();
  const rows = await db.select({
    status: emailLogs.status,
    count: count(),
  }).from(emailLogs).groupBy(emailLogs.status);
  const stats = { total: 0, sent: 0, opened: 0, replied: 0, bounced: 0 };
  for (const r of rows) {
    const n = Number(r.count);
    stats.total += n;
    if (r.status === 'sent' || r.status === 'delivered') stats.sent += n;
    if (r.status === 'opened') { stats.sent += n; stats.opened += n; }
    if (r.status === 'replied') { stats.sent += n; stats.opened += n; stats.replied += n; }
    if (r.status === 'bounced') stats.bounced += n;
  }
  return stats;
}

// ── Generated Sites ───────────────────────────────────────────────────────────
export async function insertGeneratedSite(data: {
  prospectId: string;
  url?: string;
  status?: GeneratedSiteStatus;
  templateType?: string;
  includes?: string[];
  metadata?: Record<string, unknown>;
}): Promise<GeneratedSite> {
  const db = getDb();
  const id = uuidv4();
  const row = {
    id,
    prospectId: data.prospectId,
    url: data.url ?? null,
    status: data.status ?? 'generating' as GeneratedSiteStatus,
    templateType: data.templateType ?? null,
    includes: data.includes ? JSON.stringify(data.includes) : null,
    generatedAt: new Date(),
    publishedAt: null,
    viewCount: 0,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    inputTokens: null,
    outputTokens: null,
    estimatedCostUsd: null,
  };
  await db.insert(generatedSites).values(row);
  return row as GeneratedSite;
}

export async function updateGeneratedSite(id: string, data: Partial<{
  url: string;
  status: GeneratedSiteStatus;
  publishedAt: Date;
  viewCount: number;
  metadata: Record<string, unknown>;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: string;
}>): Promise<void> {
  const db = getDb();
  const update: Record<string, unknown> = {};
  if (data.url !== undefined) update.url = data.url;
  if (data.status !== undefined) update.status = data.status;
  if (data.publishedAt !== undefined) update.publishedAt = data.publishedAt;
  if (data.viewCount !== undefined) update.viewCount = data.viewCount;
  if (data.metadata !== undefined) update.metadata = JSON.stringify(data.metadata);
  if (data.inputTokens !== undefined) update.inputTokens = data.inputTokens;
  if (data.outputTokens !== undefined) update.outputTokens = data.outputTokens;
  if (data.estimatedCostUsd !== undefined) update.estimatedCostUsd = data.estimatedCostUsd;
  await db.update(generatedSites).set(update).where(eq(generatedSites.id, id));
}

export async function listGeneratedSites(opts: {
  prospectId?: string;
  status?: GeneratedSiteStatus;
  limit?: number;
} = {}): Promise<GeneratedSite[]> {
  const db = getDb();
  const { prospectId, status, limit = 50 } = opts;
  const conditions = [];
  if (prospectId) conditions.push(eq(generatedSites.prospectId, prospectId));
  if (status) conditions.push(eq(generatedSites.status, status));
  const query = db.select().from(generatedSites)
    .orderBy(desc(generatedSites.generatedAt))
    .limit(limit);
  if (conditions.length > 0) return query.where(and(...conditions));
  return query;
}

export async function getGeneratedSite(id: string): Promise<GeneratedSite | undefined> {
  const db = getDb();
  const rows = await db.select().from(generatedSites).where(eq(generatedSites.id, id)).limit(1);
  return rows[0];
}

/** Sites that have a deploymentId and non-terminal status (generating or pending_review). */
export async function listSitesWithPendingDeployments(limit = 100): Promise<GeneratedSite[]> {
  const db = getDb();
  const rows = await db.select()
    .from(generatedSites)
    .where(inArray(generatedSites.status, ['generating', 'pending_review']))
    .orderBy(desc(generatedSites.generatedAt))
    .limit(limit * 2);
  const out: GeneratedSite[] = [];
  for (const row of rows) {
    if (out.length >= limit) break;
    let meta: Record<string, unknown> = {};
    if (row.metadata) {
      try {
        meta = JSON.parse(row.metadata) as Record<string, unknown>;
      } catch {
        continue;
      }
    }
    if (meta.deploymentId) out.push(row);
  }
  return out;
}

export async function getSiteStats(): Promise<{
  total: number;
  published: number;
  generating: number;
}> {
  const db = getDb();
  const rows = await db.select({
    status: generatedSites.status,
    count: count(),
  }).from(generatedSites).groupBy(generatedSites.status);
  const stats = { total: 0, published: 0, generating: 0 };
  for (const r of rows) {
    const n = Number(r.count);
    stats.total += n;
    if (r.status === 'published') stats.published += n;
    if (r.status === 'generating') stats.generating += n;
  }
  return stats;
}

// ── Agent State ───────────────────────────────────────────────────────────────
const SINGLETON_ID = 'singleton';

export async function getAgentState(): Promise<AgentStateRow> {
  const db = getDb();
  const rows = await db.select().from(agentState).where(eq(agentState.id, SINGLETON_ID)).limit(1);
  if (rows[0]) return rows[0];
  // Bootstrap singleton
  const defaultRow: AgentStateRow = {
    id: SINGLETON_ID,
    status: 'paused',
    currentWorkflows: null,
    lastHeartbeat: null,
    config: JSON.stringify({
      discoveryEnabled: true,
      emailEnabled: true,
      siteGenEnabled: true,
      emailRatePerHour: 20,
      maxProspectsPerTick: 3,
    }),
    pausedBy: null,
    pausedAt: null,
  };
  await db.insert(agentState).values(defaultRow);
  return defaultRow;
}

export async function updateAgentState(data: Partial<Omit<AgentStateRow, 'id'>>): Promise<void> {
  const db = getDb();
  await getAgentState(); // ensure singleton exists
  await db.update(agentState).set(data).where(eq(agentState.id, SINGLETON_ID));
}

export async function setAgentStatus(
  status: AgentStatus,
  pausedBy?: 'admin' | 'system' | 'error'
): Promise<void> {
  const update: Partial<AgentStateRow> = { status };
  if (status === 'paused' || status === 'error') {
    update.pausedBy = pausedBy ?? 'system';
    update.pausedAt = new Date();
  } else {
    update.pausedBy = null;
    update.pausedAt = null;
  }
  await updateAgentState(update);
}

export async function heartbeat(): Promise<void> {
  await updateAgentState({ lastHeartbeat: new Date() });
}

// ── Agent Ticks ───────────────────────────────────────────────────────────────
export async function insertAgentTick(data: {
  startedAt: Date;
  discovered?: number;
  emailsSent?: number;
  followUpsSent?: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: string;
  outflowTxHash?: string;
  outflowAmountUsdc?: string;
  status?: string;
}): Promise<AgentTick> {
  const db = getDb();
  const id = uuidv4();
  const row = {
    id,
    startedAt: data.startedAt,
    completedAt: new Date(),
    discovered: data.discovered ?? 0,
    emailsSent: data.emailsSent ?? 0,
    followUpsSent: data.followUpsSent ?? 0,
    inputTokens: data.inputTokens ?? 0,
    outputTokens: data.outputTokens ?? 0,
    estimatedCostUsd: data.estimatedCostUsd ?? null,
    outflowTxHash: data.outflowTxHash ?? null,
    outflowAmountUsdc: data.outflowAmountUsdc ?? null,
    status: data.status ?? 'completed',
  };
  await db.insert(agentTicks).values(row);
  return row;
}

export async function listAgentTicks(limit = 20): Promise<AgentTick[]> {
  const db = getDb();
  return db.select().from(agentTicks).orderBy(desc(agentTicks.startedAt)).limit(limit);
}

export async function getTickFinanceSummary(): Promise<{
  totalTicks: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalAiCostUsd: number;
  totalOutflowUsdc: number;
  revenueVendorFees: number;
}> {
  const db = getDb();

  const [tickRows, onboardingRows] = await Promise.all([
    db.select({
      totalTicks: count(),
      totalInputTokens: sum(agentTicks.inputTokens),
      totalOutputTokens: sum(agentTicks.outputTokens),
      totalOutflowUsdc: sum(agentTicks.outflowAmountUsdc),
    }).from(agentTicks),
    db.select({ count: count() })
      .from(vendorOnboardings)
      .where(sql`${vendorOnboardings.feePaidAt} IS NOT NULL`),
  ]);

  const t = tickRows[0];

  // Sum up estimatedCostUsd (stored as text) manually
  const costRows = await db.select({ cost: agentTicks.estimatedCostUsd }).from(agentTicks);
  const totalAiCostUsd = costRows.reduce((acc, r) => acc + parseFloat(r.cost ?? '0'), 0);

  return {
    totalTicks: Number(t.totalTicks ?? 0),
    totalInputTokens: Number(t.totalInputTokens ?? 0),
    totalOutputTokens: Number(t.totalOutputTokens ?? 0),
    totalAiCostUsd,
    totalOutflowUsdc: Number(t.totalOutflowUsdc ?? 0),
    revenueVendorFees: Number(onboardingRows[0]?.count ?? 0),
  };
}

// ── Agentic costs ─────────────────────────────────────────────────────────────
export async function insertAgenticCost(data: {
  id: string;
  operation: string;
  entityType?: string;
  entityId?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: string;
}): Promise<void> {
  const db = getDb();
  const row: typeof agenticCosts.$inferInsert = {
    id: data.id,
    operation: data.operation as AgenticCostOperation,
    entityType: (data.entityType ?? null) as AgenticCostEntityType | null | undefined,
    entityId: data.entityId ?? null,
    model: data.model,
    inputTokens: data.inputTokens,
    outputTokens: data.outputTokens,
    estimatedCostUsd: data.estimatedCostUsd,
  };
  await db.insert(agenticCosts).values(row);
}

export async function getAgenticCostSummary(): Promise<{
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  byOperation: Record<string, number>;
}> {
  const db = getDb();
  const rows = await db.select().from(agenticCosts);
  let totalCostUsd = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const byOperation: Record<string, number> = {};
  for (const r of rows) {
    const cost = parseFloat(r.estimatedCostUsd ?? '0');
    totalCostUsd += cost;
    totalInputTokens += r.inputTokens;
    totalOutputTokens += r.outputTokens;
    byOperation[r.operation] = (byOperation[r.operation] ?? 0) + cost;
  }
  return { totalCostUsd, totalInputTokens, totalOutputTokens, byOperation };
}

// ── Metric Overview ───────────────────────────────────────────────────────────
export async function getMetricsOverview(): Promise<{
  totalProspects: number;
  contacted: number;
  converted: number;
  activeSites: number;
}> {
  const db = getDb();
  const [totalRows, contactedRows, convertedRows, siteRows] = await Promise.all([
    db.select({ count: count() }).from(prospects),
    db.select({ count: count() }).from(prospects).where(
      sql`${prospects.pipelineStage} IN ('contacted','engaged','onboarding','converted')`
    ),
    db.select({ count: count() }).from(prospects).where(eq(prospects.pipelineStage, 'converted')),
    db.select({ count: count() }).from(generatedSites).where(eq(generatedSites.status, 'published')),
  ]);
  return {
    totalProspects: Number(totalRows[0]?.count ?? 0),
    contacted: Number(contactedRows[0]?.count ?? 0),
    converted: Number(convertedRows[0]?.count ?? 0),
    activeSites: Number(siteRows[0]?.count ?? 0),
  };
}

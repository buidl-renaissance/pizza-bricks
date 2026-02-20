import { getDb } from '@/db/drizzle';
import { prospects, emailLogs, generatedSites, activityEvents } from '@/db/schema';
import { count, eq, and, lt, gt, isNull } from 'drizzle-orm';

export type AlertSeverity = 'info' | 'warning' | 'error';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  createdAt: Date;
}

export async function computeAlerts(): Promise<Alert[]> {
  const db = getDb();
  const alerts: Alert[] = [];
  const now = new Date();

  // Alert: prospects stuck in 'discovered' for > 7 days with no email
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const stuckRows = await db.select({ count: count() }).from(prospects).where(
    and(
      eq(prospects.pipelineStage, 'discovered'),
      lt(prospects.discoveredAt, sevenDaysAgo),
    )
  );
  const stuckCount = Number(stuckRows[0]?.count ?? 0);
  if (stuckCount > 0) {
    alerts.push({
      id: 'stuck-discovered',
      severity: 'warning',
      title: `${stuckCount} prospect${stuckCount > 1 ? 's' : ''} stuck in Discovered`,
      detail: `${stuckCount} prospect(s) have been in 'discovered' stage for over 7 days with no outreach.`,
      createdAt: now,
    });
  }

  // Alert: bounced emails in last 24 hours
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const bouncedRows = await db.select({ count: count() }).from(emailLogs).where(
    and(
      eq(emailLogs.status, 'bounced'),
      gt(emailLogs.sentAt!, oneDayAgo),
    )
  );
  const bouncedCount = Number(bouncedRows[0]?.count ?? 0);
  if (bouncedCount > 0) {
    alerts.push({
      id: 'email-bounces',
      severity: 'error',
      title: `${bouncedCount} email bounce${bouncedCount > 1 ? 's' : ''} in last 24h`,
      detail: 'Check prospect email addresses and sender domain reputation.',
      createdAt: now,
    });
  }

  // Alert: sites stuck in 'generating' for > 30 min
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const stuckSitesRows = await db.select({ count: count() }).from(generatedSites).where(
    and(
      eq(generatedSites.status, 'generating'),
      lt(generatedSites.generatedAt, thirtyMinAgo),
    )
  );
  const stuckSites = Number(stuckSitesRows[0]?.count ?? 0);
  if (stuckSites > 0) {
    alerts.push({
      id: 'sites-stuck',
      severity: 'warning',
      title: `${stuckSites} site${stuckSites > 1 ? 's' : ''} stuck in generating`,
      detail: 'Site generation may have timed out. Check Vercel deployments.',
      createdAt: now,
    });
  }

  // Alert: recent agent errors
  const recentErrors = await db.select({ count: count() }).from(activityEvents).where(
    and(
      eq(activityEvents.type, 'agent_error'),
      gt(activityEvents.createdAt, oneDayAgo),
    )
  );
  const errorCount = Number(recentErrors[0]?.count ?? 0);
  if (errorCount > 0) {
    alerts.push({
      id: 'agent-errors',
      severity: 'error',
      title: `${errorCount} agent error${errorCount > 1 ? 's' : ''} in last 24h`,
      detail: 'Check the Activity tab for details on recent errors.',
      createdAt: now,
    });
  }

  return alerts;
}

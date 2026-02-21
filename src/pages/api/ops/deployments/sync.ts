import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import {
  listSitesWithPendingDeployments,
  updateGeneratedSite,
  updateProspectStage,
  insertActivityEvent,
  getProspect,
} from '@/db/ops';
import { getDeploymentStatus, getDeploymentBuildLogs } from '@/lib/vercel-deployer';
import { triggerOutreachEmailForPublishedSite } from '@/lib/outreach-auto-send';
import type { DeploymentStatus } from '@/lib/vercel-deployer';

type SyncSummary = {
  checked: number;
  updated: number;
  failed: number;
  stillPending: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: true; summary: SyncSummary } | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const summary: SyncSummary = { checked: 0, updated: 0, failed: 0, stillPending: 0 };

  try {
    const sites = await listSitesWithPendingDeployments();
    summary.checked = sites.length;

    for (const site of sites) {
      const meta = site.metadata
        ? (JSON.parse(site.metadata) as Record<string, unknown>)
        : {};
      const deploymentId = meta.deploymentId as string | undefined;
      if (!deploymentId) continue;

      let deployment: { readyState: DeploymentStatus; url?: string };
      try {
        deployment = await getDeploymentStatus(deploymentId);
      } catch (err) {
        summary.failed += 1;
        await updateGeneratedSite(site.id, {
          status: 'revision_requested',
          metadata: {
            ...meta,
            deploymentId,
            deploymentStatus: 'ERROR' as DeploymentStatus,
            deploymentStatusUpdatedAt: Date.now(),
            buildErrorSummary: err instanceof Error ? err.message : 'Failed to fetch deployment status',
          },
        });
        await insertActivityEvent({
          type: 'agent_error',
          prospectId: site.prospectId,
          targetLabel: (await getProspect(site.prospectId))?.name ?? site.prospectId,
          detail: `Deployment ${deploymentId} sync failed: ${err instanceof Error ? err.message : String(err)}`,
          status: 'failed',
          triggeredBy: 'system',
          metadata: { siteId: site.id, deploymentId },
        });
        continue;
      }

      const now = Date.now();
      const statusMeta = {
        ...meta,
        deploymentId,
        deploymentStatus: deployment.readyState,
        deploymentStatusUpdatedAt: now,
      };

      if (deployment.readyState === 'READY') {
        const url = deployment.url ? `https://${deployment.url}` : site.url ?? undefined;
        await updateGeneratedSite(site.id, {
          url: url ?? site.url ?? undefined,
          status: 'published',
          publishedAt: new Date(),
          metadata: statusMeta,
        });
        await updateProspectStage(site.prospectId, 'onboarding');
        const prospect = await getProspect(site.prospectId);
        await insertActivityEvent({
          type: 'site_published',
          prospectId: site.prospectId,
          targetLabel: prospect?.name ?? site.prospectId,
          detail: `Site published at ${url ?? deployment.url}`,
          status: 'completed',
          triggeredBy: 'system',
          metadata: { url: url ?? deployment.url, siteId: site.id },
        });
        // Auto-send outreach email when site was built from Vendor Outreach (Prepare) flow
        if (url) {
          const result = await triggerOutreachEmailForPublishedSite(site.prospectId, url);
          if (result.sent) {
            console.log(`[deployments/sync] Auto-sent outreach email for prospect ${site.prospectId}`);
          } else if (result.error) {
            console.warn(`[deployments/sync] Auto-send outreach skipped/failed: ${result.error}`);
          } else {
            console.log(`[deployments/sync] Auto-send outreach skipped for prospect ${site.prospectId} (e.g. not from outreach flow)`);
          }
        }
        summary.updated += 1;
      } else if (deployment.readyState === 'ERROR' || deployment.readyState === 'CANCELED') {
        let buildErrorSummary = `Build ${deployment.readyState.toLowerCase()}`;
        try {
          const logs = await getDeploymentBuildLogs(deploymentId);
          if (logs.buildErrorSummary) buildErrorSummary = logs.buildErrorSummary;
        } catch {
          // keep default message if logs fetch fails
        }
        await updateGeneratedSite(site.id, {
          status: 'revision_requested',
          metadata: {
            ...statusMeta,
            buildErrorSummary,
          },
        });
        const prospect = await getProspect(site.prospectId);
        await insertActivityEvent({
          type: 'agent_error',
          prospectId: site.prospectId,
          targetLabel: prospect?.name ?? site.prospectId,
          detail: `Site build ${deployment.readyState.toLowerCase()} for deployment ${deploymentId}`,
          status: 'failed',
          triggeredBy: 'system',
          metadata: { siteId: site.id, deploymentId },
        });
        summary.failed += 1;
      } else {
        await updateGeneratedSite(site.id, { metadata: statusMeta });
        summary.stillPending += 1;
      }
    }

    return res.status(200).json({ success: true, summary });
  } catch (err) {
    console.error('[deployments/sync] error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

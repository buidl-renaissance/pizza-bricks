import {
  insertGeneratedSite,
  updateGeneratedSite,
  insertActivityEvent,
  getProspect,
  getGeneratedSite,
  updateProspectStage,
} from '@/db/ops';
import { runSitePipeline, deriveBiteBiteConfig } from '@/lib/site-pipeline';
import { recordAgenticCost } from '@/lib/agentic-cost';
import { triggerOutreachEmailForPublishedSite } from '@/lib/outreach-auto-send';

/**
 * Start site generation for a prospect. Returns siteId immediately; pipeline runs in background.
 */
export async function startSiteGenerationForProspect(prospectId: string): Promise<string> {
  const prospect = await getProspect(prospectId);
  if (!prospect) throw new Error(`Prospect ${prospectId} not found`);

  const siteRecord = await insertGeneratedSite({
    prospectId,
    status: 'generating',
    templateType: prospect.type,
    includes: ['menu', 'contact', 'order'],
  });

  await insertActivityEvent({
    type: 'site_generated',
    prospectId,
    targetLabel: prospect.name,
    detail: `Started site generation for ${prospect.name}`,
    status: 'active',
    triggeredBy: 'agent',
    metadata: { siteId: siteRecord.id },
  });

  const doc = buildProspectDocument(prospect);
  const biteBiteConfig = deriveBiteBiteConfig(prospect);

  runSitePipeline({
    document: doc,
    waitForReady: false,
    prospectId,
    ...(biteBiteConfig ? { biteBiteConfig } : {}),
  })
    .then(async (result) => {
      if (result.usage) {
        await recordAgenticCost({
          operation: 'website_generation',
          entityType: 'generated_site',
          entityId: siteRecord.id,
          model: result.usage.model,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          thinkingTokens: result.usage.thinkingTokens,
        });
      }
      await updateGeneratedSite(siteRecord.id, {
        url: result.url,
        status: result.status === 'READY' ? 'published' : 'pending_review',
        publishedAt: result.status === 'READY' ? new Date() : undefined,
        metadata: { deploymentId: result.deploymentId, vercelProjectId: result.projectId },
        ...(result.usage
          ? {
              inputTokens: result.usage.inputTokens,
              outputTokens: result.usage.outputTokens,
              estimatedCostUsd: result.usage.estimatedCostUsd,
            }
          : {}),
      });
      if (result.status === 'READY') {
        await updateProspectStage(prospectId, 'onboarding');
        await insertActivityEvent({
          type: 'site_published',
          prospectId,
          targetLabel: prospect.name,
          detail: `Site published at ${result.url}`,
          status: 'completed',
          triggeredBy: 'agent',
          metadata: { url: result.url, siteId: siteRecord.id },
        });
        // Auto-send outreach email when site was built from Vendor Outreach (Prepare) flow
        if (result.url) {
          triggerOutreachEmailForPublishedSite(prospectId, result.url).then((r) => {
            if (!r.sent && r.error) console.warn('[site-generation] Auto-send outreach:', r.error);
          });
        }
      }
    })
    .catch(async (err) => {
      await updateGeneratedSite(siteRecord.id, { status: 'revision_requested' });
      await insertActivityEvent({
        type: 'agent_error',
        prospectId,
        targetLabel: prospect.name,
        detail: `Site generation failed: ${err instanceof Error ? err.message : String(err)}`,
        status: 'failed',
        triggeredBy: 'agent',
        metadata: { siteId: siteRecord.id },
      });
    });

  return siteRecord.id;
}

/** Generate site for prospect (fire-and-forget; returns siteId once record is created). */
export async function generateSiteForProspect(prospectId: string): Promise<string> {
  return startSiteGenerationForProspect(prospectId);
}

/** Update an existing site for a prospect (redeploy to same Vercel project). */
export async function updateSiteForProspect(prospectId: string, siteId: string): Promise<void> {
  const prospect = await getProspect(prospectId);
  const site = await getGeneratedSite(siteId);
  if (!prospect) throw new Error(`Prospect ${prospectId} not found`);
  if (!site) throw new Error(`Site ${siteId} not found`);
  if (site.prospectId !== prospectId) throw new Error('Site does not belong to this prospect');

  let vercelProjectId: string | undefined;
  if (site.metadata) {
    try {
      const meta = JSON.parse(site.metadata) as Record<string, unknown>;
      vercelProjectId = meta.vercelProjectId as string | undefined;
    } catch {
      /* ignore */
    }
  }
  if (!vercelProjectId) {
    throw new Error('Site has no vercelProjectId; cannot update. Use generateSiteForProspect for new site.');
  }

  const doc = buildProspectDocument(prospect);
  const biteBiteConfig = deriveBiteBiteConfig(prospect);

  await updateGeneratedSite(siteId, { status: 'generating' });

  try {
    const result = await runSitePipeline({
      document: doc,
      waitForReady: false,
      existingProjectId: vercelProjectId,
      ...(biteBiteConfig ? { biteBiteConfig } : {}),
    });

    if (result.usage) {
      await recordAgenticCost({
        operation: 'website_generation',
        entityType: 'generated_site',
        entityId: siteId,
        model: result.usage.model,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        thinkingTokens: result.usage.thinkingTokens,
      });
    }

    await updateGeneratedSite(siteId, {
      url: result.url,
      status: result.status === 'READY' ? 'published' : 'pending_review',
      publishedAt: result.status === 'READY' ? new Date() : undefined,
      metadata: {
        deploymentId: result.deploymentId,
        vercelProjectId: result.projectId || vercelProjectId,
        deploymentStatus: result.status,
      },
      ...(result.usage
        ? {
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            estimatedCostUsd: result.usage.estimatedCostUsd,
          }
        : {}),
    });

    await insertActivityEvent({
      type: 'site_updated',
      prospectId,
      targetLabel: prospect.name,
      detail: `Site updated at ${result.url}`,
      status: 'completed',
      triggeredBy: 'agent',
      metadata: { siteId, url: result.url },
    });
  } catch (err) {
    await updateGeneratedSite(siteId, { status: 'revision_requested' });
    await insertActivityEvent({
      type: 'agent_error',
      prospectId,
      targetLabel: prospect.name,
      detail: `Site update failed: ${err instanceof Error ? err.message : String(err)}`,
      status: 'failed',
      triggeredBy: 'agent',
      metadata: { siteId },
    });
    throw err;
  }
}

function buildProspectDocument(prospect: Awaited<ReturnType<typeof getProspect>>): string {
  if (!prospect) return '';
  const parts = [
    `${prospect.name} is a ${prospect.type} located in ${prospect.city ?? 'Detroit'}.`,
  ];
  if (prospect.contactName) parts.push(`Contact: ${prospect.contactName}.`);
  if (prospect.address) parts.push(`Address: ${prospect.address}.`);
  if (prospect.phone) parts.push(`Phone: ${prospect.phone}.`);
  if (prospect.email) parts.push(`Email: ${prospect.email}.`);
  parts.push('They are joining the Bricks platform to accept online orders and offer a crypto-backed loyalty program.');
  return parts.join(' ');
}

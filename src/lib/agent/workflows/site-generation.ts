import {
  insertGeneratedSite,
  updateGeneratedSite,
  insertActivityEvent,
  getProspect,
  updateProspectStage,
} from '@/db/ops';
import { runSitePipeline } from '@/lib/site-pipeline';

export async function generateSiteForProspect(prospectId: string): Promise<void> {
  const prospect = await getProspect(prospectId);
  if (!prospect) throw new Error(`Prospect ${prospectId} not found`);

  // Create a pending site record
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

  // Build a synthetic document for the pipeline
  const doc = buildProspectDocument(prospect);

  try {
    const result = await runSitePipeline({ document: doc, waitForReady: false });

    await updateGeneratedSite(siteRecord.id, {
      url: result.url,
      status: result.status === 'READY' ? 'published' : 'pending_review',
      publishedAt: result.status === 'READY' ? new Date() : undefined,
      metadata: { deploymentId: result.deploymentId, vercelProjectId: result.projectId },
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
    }
  } catch (err) {
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
  parts.push('They are joining the eThembre blockchain platform to accept online orders and offer a crypto-backed loyalty program.');
  return parts.join(' ');
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { getGeneratedSite, getProspect, updateGeneratedSite, insertActivityEvent } from '@/db/ops';
import * as SitePipeline from '@/lib/site-pipeline';
import { deployToVercel } from '@/lib/vercel-deployer';
import { fetchDeploymentSource } from '@/lib/vercel-deployer';
import { applySiteEdits } from '@/lib/site-editor';

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: true; url: string; message?: string } | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const { id: siteId } = req.query as { id: string };
  if (!siteId) {
    return res.status(400).json({ error: 'Site id is required' });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const site = await getGeneratedSite(siteId);
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }

  const prospect = await getProspect(site.prospectId);
  if (!prospect) {
    return res.status(404).json({ error: 'Prospect not found' });
  }

  let deploymentId: string | undefined;
  let projectId: string | undefined;
  if (site.metadata) {
    try {
      const meta = JSON.parse(site.metadata) as Record<string, unknown>;
      deploymentId = meta.deploymentId as string | undefined;
      projectId = meta.vercelProjectId as string | undefined;
    } catch {
      /* ignore */
    }
  }

  if (!deploymentId || !projectId) {
    return res.status(400).json({
      error: 'Site has no deployment. Redeploy first to enable prompt-based edits.',
    });
  }

  try {
    let files;
    try {
      files = await fetchDeploymentSource(deploymentId);
    } catch (fetchErr) {
      console.warn('[sites/update] Could not fetch deployment source, falling back to full pipeline:', fetchErr);
      const doc = buildProspectDocument(prospect);
      const enrichedDoc = `${doc}\n\nUser requested changes: ${prompt}`;
      const biteBiteConfig = SitePipeline.deriveBiteBiteConfig(prospect);
      const result = await SitePipeline.runSitePipeline({
        document: enrichedDoc,
        waitForReady: false,
        prospectId: site.prospectId,
        existingProjectId: projectId,
        ...(biteBiteConfig ? { biteBiteConfig } : {}),
      });
      await updateGeneratedSite(siteId, {
        url: result.url,
        status: 'pending_review',
        metadata: {
          deploymentId: result.deploymentId,
          vercelProjectId: result.projectId,
          deploymentStatus: result.status,
          deploymentStatusUpdatedAt: Date.now(),
        },
      });
      await insertActivityEvent({
        type: 'site_updated',
        prospectId: site.prospectId,
        targetLabel: prospect.name,
        detail: `Site updated via full regeneration (source unavailable): ${result.url}`,
        status: 'completed',
        triggeredBy: 'manual',
        metadata: { siteId, url: result.url, prompt },
      });
      return res.status(200).json({
        success: true,
        url: result.url,
        message: 'Applied via full regeneration (source unavailable).',
      });
    }

    if (!files.length) {
      return res.status(400).json({
        error: 'No source files found in deployment. Try redeploying first.',
      });
    }

    const modifiedFiles = await applySiteEdits(files, prompt);
    const slug = prospect.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s-]+/g, '-')
      .slice(0, 40);
    const projectName = `pizzabox-${slug}`;
    const deployment = await deployToVercel({
      name: projectName,
      files: modifiedFiles,
      projectId,
    });

    const url = `https://${deployment.url}`;
    await updateGeneratedSite(siteId, {
      url,
      status: 'pending_review',
      metadata: {
        deploymentId: deployment.id,
        vercelProjectId: deployment.projectId ?? projectId,
        deploymentStatus: deployment.readyState,
        deploymentStatusUpdatedAt: Date.now(),
      },
    });

    await insertActivityEvent({
      type: 'site_updated',
      prospectId: site.prospectId,
      targetLabel: prospect.name,
      detail: `Site updated with prompt edits: ${url}`,
      status: 'completed',
      triggeredBy: 'manual',
      metadata: { siteId, url, prompt },
    });

    return res.status(200).json({ success: true, url });
  } catch (err) {
    console.error('[sites/update] error:', err);
    await insertActivityEvent({
      type: 'agent_error',
      prospectId: site.prospectId,
      targetLabel: prospect.name,
      detail: `Website update failed: ${err instanceof Error ? err.message : String(err)}`,
      status: 'failed',
      triggeredBy: 'manual',
      metadata: { siteId, prompt },
    });
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

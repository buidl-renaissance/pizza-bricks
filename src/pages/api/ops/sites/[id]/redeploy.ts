import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { getGeneratedSite, getProspect, updateGeneratedSite } from '@/db/ops';
import { runSitePipeline } from '@/lib/site-pipeline';

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
  res: NextApiResponse<{ success: true; deploymentId: string; url: string } | { error: string }>
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

  const site = await getGeneratedSite(siteId);
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }

  const prospect = await getProspect(site.prospectId);
  if (!prospect) {
    return res.status(404).json({ error: 'Prospect not found' });
  }

  let existingProjectId: string | undefined;
  if (site.metadata) {
    try {
      const meta = JSON.parse(site.metadata) as Record<string, unknown>;
      existingProjectId = meta.vercelProjectId as string | undefined;
    } catch {
      /* ignore */
    }
  }

  try {
    const doc = buildProspectDocument(prospect);
    const result = await runSitePipeline({
      document: doc,
      waitForReady: false,
      prospectId: site.prospectId,
      ...(existingProjectId ? { existingProjectId } : {}),
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
    return res.status(200).json({
      success: true,
      deploymentId: result.deploymentId,
      url: result.url,
    });
  } catch (err) {
    console.error('[sites/redeploy] error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { getDeploymentStatus, getDeploymentBuildLogs } from '@/lib/vercel-deployer';

type LogsResponse = {
  status: string;
  url: string | null;
  buildErrorSummary?: string;
  rawLogs?: { type?: string; created?: number; payload?: Record<string, unknown> }[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogsResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const { deploymentId } = req.query as { deploymentId: string };
  if (!deploymentId) {
    return res.status(400).json({ error: 'deploymentId is required' });
  }

  const includeRaw = req.query.raw === 'true' || req.query.raw === '1';

  try {
    const [deployment, logs] = await Promise.all([
      getDeploymentStatus(deploymentId),
      getDeploymentBuildLogs(deploymentId, { rawEvents: includeRaw }).catch(() => ({
        buildErrorSummary: undefined,
        rawEvents: undefined,
      })),
    ]);

    const out: LogsResponse = {
      status: deployment.readyState,
      url: deployment.url ? `https://${deployment.url}` : null,
      buildErrorSummary: logs.buildErrorSummary,
    };
    if (includeRaw && logs.rawEvents) {
      out.rawLogs = logs.rawEvents.map((e) => ({
        type: e.type,
        created: e.created,
        payload: e.payload,
      }));
    }
    return res.status(200).json(out);
  } catch (err) {
    console.error('[deployments/logs] error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

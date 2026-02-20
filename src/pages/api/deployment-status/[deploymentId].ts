import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById } from '@/db/user';
import { getDeploymentStatus, DeploymentStatus } from '@/lib/vercel-deployer';

type SuccessResponse = {
  status: DeploymentStatus;
  url: string | null;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: session cookie → getUserById (skip when SKIP_AUTH is true)
  if (process.env.SKIP_AUTH !== 'true') {
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/user_session=([^;]+)/);
    if (!sessionMatch?.[1]) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await getUserById(sessionMatch[1]);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const { deploymentId } = req.query;

    if (!deploymentId || typeof deploymentId !== 'string') {
      return res.status(400).json({ error: 'deploymentId is required' });
    }

    const deployment = await getDeploymentStatus(deploymentId);

    return res.status(200).json({
      status: deployment.readyState,
      url: deployment.url ? `https://${deployment.url}` : null,
    });
  } catch (error) {
    console.error('[deployment-status] error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRead } from '@/lib/ops-auth';
import { getMetricsOverview, getAgentState } from '@/db/ops';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireRead(req, res)) return;

  const [metrics, agent] = await Promise.all([getMetricsOverview(), getAgentState()]);
  return res.status(200).json({ ...metrics, agentStatus: agent.status });
}

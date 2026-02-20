import type { NextApiRequest, NextApiResponse } from 'next';
import { runAgentTick } from '@/lib/agent';

// Allow up to 60s for the tick
export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Cron secret auth (not session cookie)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const provided = req.headers['x-cron-secret'];
    if (provided !== cronSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const result = await runAgentTick();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[agent-tick] error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'tick failed' });
  }
}

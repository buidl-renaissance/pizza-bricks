import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById } from '@/db/user';
import { runSitePipeline, PipelineResult } from '@/lib/site-pipeline';
import { recordAgenticCost } from '@/lib/agentic-cost';

// Allow up to 5 minutes on Vercel Pro
export const config = { maxDuration: 300 };

type SuccessResponse = {
  success: true;
  result: PipelineResult;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
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
    const { document } = req.body as { document?: string };

    if (!document || !document.trim()) {
      return res.status(400).json({ error: 'document is required' });
    }

    // On Hobby plan, set waitForReady: false and use the polling endpoint instead
    const waitForReady =
      typeof req.body.waitForReady === 'boolean' ? req.body.waitForReady : true;

    const result = await runSitePipeline({
      document: document.trim(),
      waitForReady,
    });

    if (result.usage) {
      await recordAgenticCost({
        operation: 'website_generation',
        entityType: null,
        entityId: null,
        model: result.usage.model,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        thinkingTokens: result.usage.thinkingTokens,
      });
    }

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('[generate-site] error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

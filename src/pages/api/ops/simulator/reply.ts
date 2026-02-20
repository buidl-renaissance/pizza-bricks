import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { getEmailLog, getLatestUnrepliedEmailLogForProspect } from '@/db/ops';
import { processReply } from '@/lib/agent/workflows/reply-intent';

const DEFAULT_BODY = "Yes, we'd love a website and some flyers for our upcoming event. Can you send over the marketing materials?";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await requireAdmin(req, res))) return;

  const { emailLogId, prospectId, body: rawBody } = req.body as {
    emailLogId?: string;
    prospectId?: string;
    body?: string;
  };

  const body = (rawBody ?? DEFAULT_BODY).trim();
  if (!body) return res.status(400).json({ error: 'body is required' });

  let logId: string;
  let prospectIdRes: string;

  if (emailLogId) {
    const log = await getEmailLog(emailLogId);
    if (!log) return res.status(404).json({ error: 'Email log not found' });
    if (log.repliedAt) return res.status(400).json({ error: 'This email was already replied to' });
    logId = log.id;
    prospectIdRes = log.prospectId;
  } else if (prospectId) {
    const log = await getLatestUnrepliedEmailLogForProspect(prospectId);
    if (!log) return res.status(404).json({ error: 'No unreplied sent email found for this prospect' });
    logId = log.id;
    prospectIdRes = log.prospectId;
  } else {
    return res.status(400).json({ error: 'Either emailLogId or prospectId is required' });
  }

  try {
    const result = await processReply(prospectIdRes, logId, body, { triggeredBy: 'manual' });
    return res.status(200).json({
      success: true,
      prospectId: prospectIdRes,
      emailLogId: logId,
      intent: result.intent,
      dispatched: result.dispatched,
    });
  } catch (err) {
    console.error('[simulator/reply]', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Processing failed',
    });
  }
}

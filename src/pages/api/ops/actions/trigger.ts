import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { insertActivityEvent, getAgentState } from '@/db/ops';
import { getLatestUnrepliedEmailLogForProspect } from '@/db/ops';
import { runDiscovery } from '@/lib/agent/workflows/discovery';
import { runEmailOutreach, sendEmailToProspect } from '@/lib/agent/workflows/email-outreach';
import { runFollowUp } from '@/lib/agent/workflows/follow-up';
import { generateSiteForProspect } from '@/lib/agent/workflows/site-generation';
import { processReply } from '@/lib/agent/workflows/reply-intent';

export type ManualActionType =
  | 'discover_prospects'
  | 'send_outreach'
  | 'run_followups'
  | 'generate_site'
  | 'run_full_tick'
  | 'simulate_reply'
  | 'pause_agent'
  | 'resume_agent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAdmin(req, res)) return;

  const { action, prospectId, templateId, body: replyBody } = req.body as {
    action: ManualActionType;
    prospectId?: string;
    templateId?: string;
    body?: string;
  };

  if (!action) return res.status(400).json({ error: 'action is required' });

  const state = await getAgentState();
  let config = { discoveryEnabled: true, emailEnabled: true, siteGenEnabled: true, emailRatePerHour: 20, maxProspectsPerTick: 3 };
  try { if (state.config) config = { ...config, ...JSON.parse(state.config) }; } catch { /* use defaults */ }

  await insertActivityEvent({
    type: 'manual_action',
    detail: `Manual action triggered: ${action}`,
    status: 'active',
    triggeredBy: 'manual',
    metadata: { action, prospectId },
  });

  try {
    let result: Record<string, unknown> = {};

    switch (action) {
      case 'discover_prospects':
        result.discovered = await runDiscovery({ maxProspectsPerTick: config.maxProspectsPerTick });
        break;

      case 'send_outreach':
        if (prospectId && templateId) {
          await sendEmailToProspect(prospectId, templateId);
          result.sent = 1;
        } else {
          result.sent = await runEmailOutreach({ emailEnabled: true, emailRatePerHour: config.emailRatePerHour });
        }
        break;

      case 'run_followups':
        result.triggered = await runFollowUp();
        break;

      case 'generate_site':
        if (!prospectId) return res.status(400).json({ error: 'prospectId required for generate_site' });
        // Fire and forget — returns immediately
        generateSiteForProspect(prospectId).catch(console.error);
        result.status = 'started';
        break;

      case 'simulate_reply': {
        if (!prospectId) return res.status(400).json({ error: 'prospectId required for simulate_reply' });
        const log = await getLatestUnrepliedEmailLogForProspect(prospectId);
        if (!log) return res.status(400).json({ error: 'No unreplied sent email found for this prospect' });
        const body = (replyBody ?? "Yes, we'd love a website and some flyers for our upcoming event. Can you send over the marketing materials?").trim();
        const replyResult = await processReply(prospectId, log.id, body, { triggeredBy: 'manual' });
        result.intent = replyResult.intent;
        result.dispatched = replyResult.dispatched;
        break;
      }

      case 'run_full_tick': {
        const { runAgentTick } = await import('@/lib/agent');
        const tickResult = await runAgentTick();
        result = tickResult.results;
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    await insertActivityEvent({
      type: 'manual_action',
      detail: `Manual action completed: ${action}`,
      status: 'completed',
      triggeredBy: 'manual',
      metadata: { action, result },
    });

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error('[actions/trigger]', err);
    await insertActivityEvent({
      type: 'agent_error',
      detail: `Manual action failed: ${action} — ${err instanceof Error ? err.message : String(err)}`,
      status: 'failed',
      triggeredBy: 'manual',
      metadata: { action },
    });
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Action failed' });
  }
}

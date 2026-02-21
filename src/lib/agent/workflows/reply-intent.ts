import Anthropic from '@anthropic-ai/sdk';
import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';
import {
  getProspect,
  getEmailLog,
  updateEmailLogStatus,
  updateProspectStage,
  insertActivityEvent,
  findEmailLogForInboundReply,
} from '@/db/ops';
import { generateSiteForProspect } from './site-generation';

export type ReplyIntent =
  | 'website_update'
  | 'marketing_materials'
  | 'event_influencer'
  | 'general_positive'
  | 'other';

export interface ParsedReplyIntent {
  intent: ReplyIntent;
  details?: string;
}

const SYSTEM_PROMPT = `You are an assistant that classifies email reply intent from a prospect (e.g. a food vendor) who was contacted by Bricks about getting a free website and online ordering.

Classify the reply into exactly one intent using the classify_reply_intent tool:
- website_update: they want to update their website, get a website, or have a site built/redesigned.
- marketing_materials: they want additional marketing materials for a campaign (flyers, posters, assets, etc.).
- event_influencer: they propose an event or want to recruit local influencers to generate buzz.
- general_positive: they are interested or positive but no specific request above.
- other: not interested, negative, or unclear.`;

const INTENT_SCHEMA = {
  type: 'object' as const,
  properties: {
    intent: {
      type: 'string',
      enum: ['website_update', 'marketing_materials', 'event_influencer', 'general_positive', 'other'],
      description: 'The classified intent',
    },
    details: {
      type: 'string',
      description: 'Optional short note (e.g. what event, what materials)',
    },
  },
  required: ['intent'],
} satisfies Tool['input_schema'];

export async function parseReplyIntent(body: string): Promise<ParsedReplyIntent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { intent: 'other', details: 'No API key' };
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Classify this email reply:\n\n${body.slice(0, 4000)}` }],
    tools: [
      {
        name: 'classify_reply_intent',
        description: 'Classify the reply intent',
        input_schema: INTENT_SCHEMA,
      },
    ],
    tool_choice: { type: 'tool', name: 'classify_reply_intent' },
  });

  const toolBlock = response.content.find((b) => b.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    return { intent: 'other', details: 'No tool response' };
  }

  const input = toolBlock.input as { intent: ReplyIntent; details?: string };
  return {
    intent: input.intent ?? 'other',
    details: input.details,
  };
}

/**
 * Process an inbound reply: mark log as replied, move prospect to engaged,
 * parse intent, and dispatch to the appropriate workflow.
 */
export async function processReply(
  prospectId: string,
  emailLogId: string,
  body: string,
  options?: { triggeredBy?: 'agent' | 'manual' | 'system' }
): Promise<{ intent: ReplyIntent; dispatched: boolean }> {
  const triggeredBy = options?.triggeredBy ?? 'system';
  const log = await getEmailLog(emailLogId);
  const prospect = await getProspect(prospectId);
  if (!log || !prospect) {
    throw new Error(`Email log ${emailLogId} or prospect ${prospectId} not found`);
  }
  if (log.prospectId !== prospectId) {
    throw new Error('Email log does not belong to this prospect');
  }

  const now = new Date();

  if (!log.repliedAt) {
    await updateEmailLogStatus(emailLogId, 'replied', { repliedAt: now });
    await updateProspectStage(prospectId, 'engaged');
    await insertActivityEvent({
      type: 'email_replied',
      prospectId,
      targetLabel: prospect.name,
      detail: `Reply received`,
      status: 'completed',
      triggeredBy,
      metadata: { emailLogId },
    });
  }

  const { intent, details } = await parseReplyIntent(body);

  await insertActivityEvent({
    type: 'reply_intent_parsed',
    prospectId,
    targetLabel: prospect.name,
    detail: `Intent: ${intent}${details ? ` — ${details}` : ''}`,
    status: 'completed',
    triggeredBy,
    metadata: { intent, details, emailLogId },
  });

  let dispatched = false;

  switch (intent) {
    case 'website_update':
      generateSiteForProspect(prospectId).catch((err) => {
        console.error('[reply-intent] generateSiteForProspect failed:', err);
      });
      dispatched = true;
      break;

    case 'marketing_materials':
      await insertActivityEvent({
        type: 'marketing_materials_requested',
        prospectId,
        targetLabel: prospect.name,
        detail: details ?? 'Marketing materials requested',
        status: 'pending',
        triggeredBy,
        metadata: { emailLogId },
      });
      dispatched = true;
      break;

    case 'event_influencer':
      await insertActivityEvent({
        type: 'event_influencer_requested',
        prospectId,
        targetLabel: prospect.name,
        detail: details ?? 'Event or influencer recruitment requested',
        status: 'pending',
        triggeredBy,
        metadata: { emailLogId },
      });
      dispatched = true;
      break;

    case 'general_positive':
    case 'other':
      break;
  }

  return { intent, dispatched };
}

/**
 * Match an inbound reply (from, to, subject, body, inReplyTo) to an email log and process it.
 * Returns the result of processReply or null if no matching log found.
 */
export async function matchAndProcessReply(opts: {
  from: string;
  to: string[];
  subject: string;
  body: string;
  inReplyTo?: string | null;
}): Promise<{ prospectId: string; emailLogId: string; intent: ReplyIntent; dispatched: boolean } | null> {
  const log = await findEmailLogForInboundReply({
    from: opts.from,
    subject: opts.subject,
    inReplyTo: opts.inReplyTo,
  });
  if (!log) return null;
  if (log.repliedAt) return null;

  const result = await processReply(log.prospectId, log.id, opts.body);
  return {
    prospectId: log.prospectId,
    emailLogId: log.id,
    intent: result.intent,
    dispatched: result.dispatched,
  };
}

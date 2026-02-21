/**
 * Resend-based sending for Vendor Outreach (replaces Gmail).
 * Uses RESEND_FROM_EMAIL, INBOUND_REPLY_TO, and optional SIMULATOR_INBOX.
 */

import { Resend } from 'resend';
import { randomUUID } from 'crypto';

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? 'Bricks <bricks@builddetroit.xyz>';
const INBOUND_REPLY_TO = process.env.INBOUND_REPLY_TO ?? process.env.RESEND_INBOUND_REPLY_TO ?? 'bricks@builddetroit.xyz';
const SIMULATOR_INBOX = process.env.SIMULATOR_INBOX ?? null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/** Extract domain for Message-ID from FROM (e.g. "Bricks <bricks@builddetroit.xyz>" -> "builddetroit.xyz") */
function getMessageIdDomain(): string {
  const match = FROM_ADDRESS.match(/@([^>\s]+)/);
  return match ? match[1].replace(/>$/, '') : 'outreach.pizzabricks.local';
}

export interface SendOutreachEmailOptions {
  to: string;
  subject: string;
  bodyHtml: string;
  /** RFC Message-ID of the message we're replying to (sets In-Reply-To + References) */
  inReplyTo?: string;
  /** Space-separated Message-IDs for References header */
  references?: string;
}

export interface SendOutreachEmailResult {
  resendId: string;
  /** The Message-ID we set on the sent email (for storing as sentRfcMessageId or threading) */
  messageId?: string;
}

/**
 * Send an outreach email via Resend.
 * For first message in thread: generates and sets Message-ID header; returns it as messageId.
 * For replies: pass inReplyTo and optionally references for threading.
 * If SIMULATOR_INBOX is set, sends to that address instead of to.
 */
export async function sendOutreachEmail(
  options: SendOutreachEmailOptions
): Promise<SendOutreachEmailResult> {
  const resend = getResend();
  if (!resend) throw new Error('Resend is not configured (RESEND_API_KEY missing)');

  const { to, subject, bodyHtml, inReplyTo, references } = options;
  const actualTo = SIMULATOR_INBOX ?? to;
  if (SIMULATOR_INBOX) {
    console.log(`[resend-outreach] Redirecting email from "${to}" → "${SIMULATOR_INBOX}"`);
  }

  const payload: Parameters<typeof resend.emails.send>[0] = {
    from: FROM_ADDRESS,
    to: [actualTo],
    subject,
    html: bodyHtml,
    replyTo: INBOUND_REPLY_TO,
  };

  let messageId: string | undefined;

  if (inReplyTo != null) {
    payload.headers = {
      'In-Reply-To': inReplyTo.startsWith('<') ? inReplyTo : `<${inReplyTo}>`,
      ...(references ? { References: references } : {}),
    };
  } else {
    messageId = `<${randomUUID()}@${getMessageIdDomain()}>`;
    payload.headers = { 'Message-ID': messageId };
  }

  const result = await resend.emails.send(payload);
  if (result.error) throw new Error(result.error.message);
  const resendId = result.data?.id;
  if (!resendId) throw new Error('Resend did not return a message id');

  return { resendId, messageId };
}

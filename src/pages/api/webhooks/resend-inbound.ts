import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { emailReplies, vendors, outreachEmails } from '@/db/schema';
import type { OutreachDeliveryStatus } from '@/db/schema';
import { findOutreachEmailForInboundReply } from '@/db/outreach';
import { matchAndProcessReply } from '@/lib/agent/workflows/reply-intent';

const SEND_EVENT_TYPES: Record<string, OutreachDeliveryStatus> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.failed': 'failed',
  'email.delivery_delayed': 'delivery_delayed',
};

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!webhookSecret || !apiKey) {
    console.warn('[resend-inbound] RESEND_WEBHOOK_SECRET or RESEND_API_KEY not set');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  let rawBody: string;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error('[resend-inbound] Failed to read body:', err);
    return res.status(400).json({ error: 'Invalid body' });
  }

  const resend = new Resend(apiKey);
  type ResendEvent = {
    type: string;
    data?: { email_id?: string; created_at?: string; bounce?: { message?: string }; failed?: { reason?: string } };
  };
  let event: ResendEvent;
  try {
    event = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: (req.headers['svix-id'] as string) ?? '',
        timestamp: (req.headers['svix-timestamp'] as string) ?? '',
        signature: (req.headers['svix-signature'] as string) ?? '',
      },
      webhookSecret,
    }) as ResendEvent;
  } catch (err) {
    console.error('[resend-inbound] Webhook verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const deliveryStatus = SEND_EVENT_TYPES[event.type];
  if (deliveryStatus) {
    const emailId = event.data?.email_id;
    if (emailId) {
      const db = getDb();
      const rows = await db
        .select({ id: outreachEmails.id })
        .from(outreachEmails)
        .where(eq(outreachEmails.resendMessageId, emailId))
        .limit(1);
      if (rows.length > 0) {
        const details =
          event.data?.bounce?.message ?? event.data?.failed?.reason ?? undefined;
        const statusAt = event.data?.created_at ? new Date(event.data.created_at) : new Date();
        await db
          .update(outreachEmails)
          .set({
            deliveryStatus,
            deliveryStatusAt: statusAt,
            ...(details != null && details !== '' ? { deliveryDetails: details } : {}),
          })
          .where(eq(outreachEmails.id, rows[0].id));
        return res.status(200).json({
          received: true,
          event: event.type,
          outreachEmailId: rows[0].id,
          deliveryStatus,
        });
      }
    }
    return res.status(200).json({ received: true, event: event.type });
  }

  if (event.type !== 'email.received') {
    return res.status(200).json({ received: true, event: event.type });
  }

  const emailId = event.data?.email_id;
  if (!emailId) {
    return res.status(200).json({ received: true });
  }

  const emailRes = await resend.emails.receiving.get(emailId);
  if (emailRes.error || !emailRes.data) {
    console.error('[resend-inbound] Failed to fetch received email:', emailRes.error);
    return res.status(500).json({ error: 'Failed to fetch email' });
  }

  const email = emailRes.data;
  const body = (email.text ?? email.html ?? '').trim();
  const fromRaw = typeof email.from === 'string' ? email.from : (email as { from?: { email?: string } }).from?.email ?? '';
  const from = fromRaw.includes('@') && fromRaw.includes('<')
    ? fromRaw.replace(/^.*<([^>]+)>.*$/, '$1').trim().toLowerCase()
    : fromRaw.trim().toLowerCase();
  const to = Array.isArray(email.to) ? email.to : [String(email.to ?? '')];
  const subject = email.subject ?? '';
  const headers = email.headers ?? {};
  const inReplyTo = headers['in-reply-to'] ?? headers['In-Reply-To'] ?? null;

  if (!body) {
    return res.status(200).json({ received: true, matched: false, reason: 'empty body' });
  }

  // First try to match to Vendor Outreach (outreach_emails / email_replies)
  const outreachEmail = await findOutreachEmailForInboundReply({ from, subject, inReplyTo });
  if (outreachEmail) {
    const db = getDb();
    const existing = await db
      .select({ id: emailReplies.id })
      .from(emailReplies)
      .where(eq(emailReplies.resendMessageId, emailId))
      .limit(1);
    if (existing.length > 0) {
      return res.status(200).json({ received: true, matched: true, source: 'outreach', duplicate: true });
    }
    const replyId = crypto.randomUUID();
    const receivedAt = (email as { created_at?: string }).created_at
      ? new Date((email as { created_at: string }).created_at)
      : new Date();
    await db.insert(emailReplies).values({
      id: replyId,
      outreachEmailId: outreachEmail.id,
      vendorId: outreachEmail.vendorId,
      resendMessageId: emailId,
      fromEmail: from,
      subject,
      bodyText: body,
      receivedAt,
    });
    await db
      .update(vendors)
      .set({ status: 'replied', updatedAt: new Date() })
      .where(eq(vendors.id, outreachEmail.vendorId));
    return res.status(200).json({
      received: true,
      matched: true,
      source: 'outreach',
      replyId,
      outreachEmailId: outreachEmail.id,
      vendorId: outreachEmail.vendorId,
    });
  }

  // Else match to agent email_logs (prospects)
  const result = await matchAndProcessReply({
    from,
    to,
    subject,
    body,
    inReplyTo,
  });

  if (!result) {
    return res.status(200).json({ received: true, matched: false });
  }

  return res.status(200).json({
    received: true,
    matched: true,
    prospectId: result.prospectId,
    emailLogId: result.emailLogId,
    intent: result.intent,
    dispatched: result.dispatched,
  });
}

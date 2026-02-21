import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { matchAndProcessReply } from '@/lib/agent/workflows/reply-intent';

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
  let event: { type: string; data: { email_id: string } };
  try {
    event = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: (req.headers['svix-id'] as string) ?? '',
        timestamp: (req.headers['svix-timestamp'] as string) ?? '',
        signature: (req.headers['svix-signature'] as string) ?? '',
      },
      webhookSecret,
    }) as { type: string; data: { email_id: string } };
  } catch (err) {
    console.error('[resend-inbound] Webhook verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type !== 'email.received') {
    return res.status(200).json({ received: true });
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

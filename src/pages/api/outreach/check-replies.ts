import type { NextApiRequest, NextApiResponse } from 'next';
import { desc } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { emailReplies } from '@/db/schema';

/**
 * POST /api/outreach/check-replies
 *
 * With Resend, replies are ingested via the inbound webhook (email.received).
 * This endpoint returns success and optionally recent replies from the DB for the UI.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();
  const recent = await db
    .select({
      id: emailReplies.id,
      vendorId: emailReplies.vendorId,
      fromEmail: emailReplies.fromEmail,
      subject: emailReplies.subject,
      receivedAt: emailReplies.receivedAt,
      intent: emailReplies.intent,
    })
    .from(emailReplies)
    .orderBy(desc(emailReplies.receivedAt))
    .limit(20);

  return res.status(200).json({
    checked: 0,
    newReplies: 0,
    replies: recent.map((r) => ({
      replyId: r.id,
      vendorId: r.vendorId,
      from: r.fromEmail,
      receivedAt: r.receivedAt,
      intent: r.intent,
    })),
    message: 'Replies are received via Resend inbound webhook.',
  });
}

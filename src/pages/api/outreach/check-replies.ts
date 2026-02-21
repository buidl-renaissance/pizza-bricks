import type { NextApiRequest, NextApiResponse } from 'next';
import { eq, isNotNull, inArray } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { outreachEmails, emailReplies, vendors } from '@/db/schema';
import { fetchThreadReplies, isGmailConfigured } from '@/lib/gmail';

/**
 * POST /api/outreach/check-replies
 *
 * Polls Gmail for replies on every sent outreach thread.
 * Saves new replies to email_replies and marks vendors as 'replied'.
 * Does NOT run AI analysis — call /api/outreach/analyze-reply next.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isGmailConfigured()) {
    return res.status(401).json({ code: 'GMAIL_NOT_CONFIGURED', error: 'Gmail not connected' });
  }

  const db = getDb();

  // 1. Find all sent outreach emails that have a thread ID
  const sentEmails = await db
    .select()
    .from(outreachEmails)
    .where(isNotNull(outreachEmails.gmailThreadId));

  if (sentEmails.length === 0) {
    return res.status(200).json({ checked: 0, newReplies: 0, replies: [] });
  }

  const threadIds = sentEmails
    .map(e => e.gmailThreadId)
    .filter(Boolean) as string[];

  // 2. Fetch replies from Gmail for those threads
  const inboxReplies = await fetchThreadReplies(threadIds);

  if (inboxReplies.length === 0) {
    return res.status(200).json({ checked: threadIds.length, newReplies: 0, replies: [] });
  }

  // 3. Deduplicate — skip any reply already in DB
  const existingIds = await db
    .select({ gmailMessageId: emailReplies.gmailMessageId })
    .from(emailReplies)
    .where(
      inArray(
        emailReplies.gmailMessageId,
        inboxReplies.map(r => r.gmailMessageId)
      )
    )
    .then(rows => new Set(rows.map(r => r.gmailMessageId)));

  const newReplies = inboxReplies.filter(r => !existingIds.has(r.gmailMessageId));

  // 4. Map each reply back to its outreachEmail and vendor
  const threadToEmail = new Map(sentEmails.map(e => [e.gmailThreadId!, e]));
  const saved = [];

  for (const reply of newReplies) {
    const outreachEmail = threadToEmail.get(reply.gmailThreadId);
    if (!outreachEmail) continue;

    await db.insert(emailReplies).values({
      id: crypto.randomUUID(),
      outreachEmailId: outreachEmail.id,
      vendorId: outreachEmail.vendorId,
      gmailMessageId: reply.gmailMessageId,
      gmailThreadId: reply.gmailThreadId,
      rfcMessageId: reply.rfcMessageId ?? null,
      fromEmail: reply.fromEmail,
      subject: reply.subject,
      bodyText: reply.bodyText,
      receivedAt: reply.receivedAt,
    });

    // Mark vendor as replied (if not already further in the pipeline)
    await db
      .update(vendors)
      .set({ status: 'replied', updatedAt: new Date() })
      .where(eq(vendors.id, outreachEmail.vendorId));

    saved.push({
      replyId: reply.gmailMessageId,
      vendorId: outreachEmail.vendorId,
      from: reply.fromEmail,
      threadId: reply.gmailThreadId,
    });

    console.log(`New reply saved: ${reply.fromEmail} → thread ${reply.gmailThreadId}`);
  }

  return res.status(200).json({
    checked: threadIds.length,
    newReplies: saved.length,
    replies: saved,
  });
}

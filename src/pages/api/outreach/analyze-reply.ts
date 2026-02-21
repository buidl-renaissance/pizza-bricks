import type { NextApiRequest, NextApiResponse } from 'next';
import { eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { emailReplies, vendorOnboardings, vendors, outreachEmails } from '@/db/schema';
import { analyzeReplyIntent } from '@/lib/ai';
import { sendEmail, isGmailConfigured, getSenderEmail } from '@/lib/gmail';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function generateProspectCode(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `PB-${year}-${suffix}`;
}

function replySubject(originalSubject: string | null): string {
  const s = originalSubject || 'Your inquiry';
  return s.startsWith('Re:') ? s : `Re: ${s}`;
}

function buildInterestedReply(
  vendorName: string,
  prospectCode: string,
  onboardingToken: string,
  originalSubject: string | null
): { subject: string; bodyHtml: string } {
  const onboardingUrl = `${APP_BASE_URL}/onboard?token=${onboardingToken}`;

  return {
    subject: replySubject(originalSubject),
    bodyHtml: `
<p>Hi there,</p>

<p>That's wonderful to hear — we're excited to work with <strong>${vendorName}</strong>!</p>

<p>We've set up a personalised onboarding page just for you. It only takes a few minutes to complete:</p>

<p style="margin:24px 0;">
  <a href="${onboardingUrl}" style="background:#7B5CFF;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
    Get Started &rarr;
  </a>
</p>

<p>Your unique prospect ID is <strong>${prospectCode}</strong> — you'll need this to sign up, so keep it handy.</p>

<p>Here's what we'll set up together:</p>
<ul>
  <li>&#9989; A free sample website tailored to your business</li>
  <li>&#9989; A digital wallet to accept USDC payments from customers</li>
  <li>&#9989; Marketing materials to help grow your following</li>
</ul>

<p>Any questions? Just reply to this email and we'll get back to you.</p>

<p>Looking forward to it,<br>
The Pizza Bricks Team</p>
`.trim(),
  };
}

function buildNotInterestedReply(
  vendorName: string,
  originalSubject: string | null
): { subject: string; bodyHtml: string } {
  return {
    subject: replySubject(originalSubject),
    bodyHtml: `
<p>Hi there,</p>

<p>No worries at all — we completely understand that the timing might not be right for <strong>${vendorName}</strong> right now.</p>

<p>We'll keep your information on file, and if things change down the road, we'd love to reconnect. Our services — free website builds, digital payments, and marketing support — are always here when you're ready.</p>

<p>Thanks so much for taking the time to read our message, and best of luck with everything. We hope to cross paths again soon!</p>

<p>Warm regards,<br>
The Pizza Bricks Team</p>
`.trim(),
  };
}

function buildFollowUpReply(
  vendorName: string,
  originalSubject: string | null
): { subject: string; bodyHtml: string } {
  return {
    subject: replySubject(originalSubject),
    bodyHtml: `
<p>Hi there,</p>

<p>Thanks for getting back to us about <strong>${vendorName}</strong>!</p>

<p>We'd love to answer any questions you have. Could you tell us a bit more about what you're looking for, or what would be most useful for your business right now?</p>

<p>We're here to help — whether that's a free website, a digital payments setup, or just some guidance on next steps.</p>

<p>Looking forward to hearing from you,<br>
The Pizza Bricks Team</p>
`.trim(),
  };
}

/**
 * POST /api/outreach/analyze-reply
 *
 * Body: { replyId } | { analyzeAll: true }
 *
 * 1. Classifies each reply with Claude
 * 2. Sends an auto-reply in the same Gmail thread:
 *    - interested      → onboarding link + prospect code
 *    - not_interested  → warm thank-you
 *    - needs_follow_up → ask for more info
 * 3. Updates vendor status
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const db = getDb();
  const { replyId, analyzeAll } = req.body;

  let toProcess;
  if (analyzeAll) {
    toProcess = await db.select().from(emailReplies).where(isNull(emailReplies.analyzedAt));
  } else if (replyId) {
    toProcess = await db.select().from(emailReplies).where(eq(emailReplies.id, replyId));
  } else {
    return res.status(400).json({ error: 'Provide replyId or analyzeAll: true' });
  }

  if (toProcess.length === 0) {
    return res.status(200).json({ processed: 0, results: [] });
  }

  const gmailReady = isGmailConfigured();
  const senderEmail = gmailReady ? await getSenderEmail() : null;
  const results = [];

  for (const reply of toProcess) {
    const vendor = await db.select().from(vendors)
      .where(eq(vendors.id, reply.vendorId))
      .then(r => r[0] || null);
    if (!vendor) continue;

    // Find the original outreach email for this thread (for subject line)
    const originalEmail = reply.outreachEmailId
      ? await db.select().from(outreachEmails)
          .where(eq(outreachEmails.id, reply.outreachEmailId))
          .then(r => r[0] || null)
      : null;

    // Run AI analysis
    const analysis = await analyzeReplyIntent(vendor.name, reply.bodyText);

    await db.update(emailReplies).set({
      intent: analysis.intent,
      intentConfidence: String(analysis.confidence),
      intentSummary: analysis.summary,
      analyzedAt: new Date(),
    }).where(eq(emailReplies.id, reply.id));

    const result: Record<string, unknown> = {
      replyId: reply.id,
      vendorId: vendor.id,
      vendorName: vendor.name,
      intent: analysis.intent,
      confidence: analysis.confidence,
      summary: analysis.summary,
      autoReplySent: false,
    };

    const toEmail = reply.fromEmail.match(/<(.+)>/)?.[1] || reply.fromEmail;

    // ── Interested ────────────────────────────────────────────────────────────
    if (analysis.intent === 'interested') {
      const existing = await db.select().from(vendorOnboardings)
        .where(eq(vendorOnboardings.vendorId, vendor.id))
        .then(r => r[0] || null);

      let prospectCode: string;
      let onboardingToken: string;
      let onboardingId: string;

      if (!existing) {
        onboardingId = crypto.randomUUID();
        prospectCode = generateProspectCode();
        onboardingToken = crypto.randomUUID().replace(/-/g, '');

        await db.insert(vendorOnboardings).values({
          id: onboardingId,
          prospectCode,
          vendorId: vendor.id,
          emailReplyId: reply.id,
          onboardingToken,
          status: 'pending',
          businessName: vendor.name,
          preferredEmail: toEmail,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        result.onboardingCreated = true;
      } else {
        onboardingId = existing.id;
        prospectCode = existing.prospectCode;
        onboardingToken = existing.onboardingToken;
        result.onboardingExists = true;
      }

      result.prospectCode = prospectCode;

      if (gmailReady && senderEmail) {
        try {
          const { subject, bodyHtml } = buildInterestedReply(
            vendor.name, prospectCode, onboardingToken, originalEmail?.subject || null
          );

          const { messageId, threadId } = await sendEmail({
            to: toEmail,
            subject,
            bodyHtml,
            threadId: reply.gmailThreadId,
            inReplyTo: reply.rfcMessageId ?? reply.gmailMessageId,
          });

          await db.insert(outreachEmails).values({
            id: crypto.randomUUID(),
            vendorId: vendor.id,
            subject,
            bodyHtml,
            status: 'sent',
            gmailMessageId: messageId,
            gmailThreadId: threadId,
            sentAt: new Date(),
          } as typeof outreachEmails.$inferInsert);

          await db.update(vendorOnboardings)
            .set({ status: 'link_sent', linkSentAt: new Date(), updatedAt: new Date() })
            .where(eq(vendorOnboardings.id, onboardingId));

          result.autoReplySent = true;
          result.followUpSent = true;
          result.sentTo = toEmail;
          console.log(`[interested] Auto-reply sent to ${toEmail} in thread ${reply.gmailThreadId}`);
        } catch (err) {
          console.error('Failed to send interested reply:', err);
          result.autoReplyError = err instanceof Error ? err.message : String(err);
        }
      }

      await db.update(vendors)
        .set({ status: 'onboarding', updatedAt: new Date() })
        .where(eq(vendors.id, vendor.id));

    // ── Not interested ────────────────────────────────────────────────────────
    } else if (analysis.intent === 'not_interested') {
      if (gmailReady) {
        try {
          const { subject, bodyHtml } = buildNotInterestedReply(
            vendor.name, originalEmail?.subject || null
          );

          const { messageId, threadId } = await sendEmail({
            to: toEmail,
            subject,
            bodyHtml,
            threadId: reply.gmailThreadId,
            inReplyTo: reply.rfcMessageId ?? reply.gmailMessageId,
          });

          await db.insert(outreachEmails).values({
            id: crypto.randomUUID(),
            vendorId: vendor.id,
            subject,
            bodyHtml,
            status: 'sent',
            gmailMessageId: messageId,
            gmailThreadId: threadId,
            sentAt: new Date(),
          } as typeof outreachEmails.$inferInsert);

          result.autoReplySent = true;
          result.sentTo = toEmail;
          console.log(`[not_interested] Thank-you reply sent to ${toEmail}`);
        } catch (err) {
          console.error('Failed to send not_interested reply:', err);
          result.autoReplyError = err instanceof Error ? err.message : String(err);
        }
      }

      await db.update(vendors)
        .set({ status: 'dismissed', updatedAt: new Date() })
        .where(eq(vendors.id, vendor.id));

    // ── Needs follow-up ───────────────────────────────────────────────────────
    } else if (analysis.intent === 'needs_follow_up') {
      if (gmailReady) {
        try {
          const { subject, bodyHtml } = buildFollowUpReply(
            vendor.name, originalEmail?.subject || null
          );

          const { messageId, threadId } = await sendEmail({
            to: toEmail,
            subject,
            bodyHtml,
            threadId: reply.gmailThreadId,
            inReplyTo: reply.rfcMessageId ?? reply.gmailMessageId,
          });

          await db.insert(outreachEmails).values({
            id: crypto.randomUUID(),
            vendorId: vendor.id,
            subject,
            bodyHtml,
            status: 'sent',
            gmailMessageId: messageId,
            gmailThreadId: threadId,
            sentAt: new Date(),
          } as typeof outreachEmails.$inferInsert);

          result.autoReplySent = true;
          result.sentTo = toEmail;
          console.log(`[needs_follow_up] Follow-up question sent to ${toEmail}`);
        } catch (err) {
          console.error('Failed to send needs_follow_up reply:', err);
          result.autoReplyError = err instanceof Error ? err.message : String(err);
        }
      }
    }

    results.push(result);
  }

  return res.status(200).json({ processed: results.length, results });
}

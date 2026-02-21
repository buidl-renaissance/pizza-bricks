import type { NextApiRequest, NextApiResponse } from 'next';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendors, outreachEmails } from '@/db/schema';
import { sendEmail, isGmailConfigured } from '@/lib/gmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emailId } = req.body;
    if (!emailId) {
      return res.status(400).json({ error: 'emailId is required' });
    }

    if (!isGmailConfigured()) {
      return res.status(401).json({ code: 'GMAIL_NOT_CONFIGURED', error: 'Gmail not connected' });
    }

    const db = getDb();

    const email = await db.select().from(outreachEmails)
      .where(eq(outreachEmails.id, emailId))
      .then(r => r[0] || null);

    if (!email) {
      return res.status(404).json({ error: 'Email draft not found' });
    }

    if (email.status === 'sent') {
      return res.status(400).json({ error: 'Email already sent', gmailMessageId: email.gmailMessageId });
    }

    const vendor = await db.select().from(vendors)
      .where(eq(vendors.id, email.vendorId))
      .then(r => r[0] || null);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (!vendor.email) {
      return res.status(400).json({ error: `No email address on file for ${vendor.name}` });
    }

    const { messageId, threadId } = await sendEmail({
      to: vendor.email,
      subject: email.subject,
      bodyHtml: email.bodyHtml,
    });

    await db.update(outreachEmails).set({
      status: 'sent',
      gmailMessageId: messageId,
      gmailThreadId: threadId,
      sentAt: new Date(),
    }).where(eq(outreachEmails.id, emailId));

    await db.update(vendors).set({
      status: 'contacted',
      updatedAt: new Date(),
    }).where(eq(vendors.id, vendor.id));

    return res.status(200).json({
      success: true,
      messageId,
      sentTo: vendor.email,
    });
  } catch (err) {
    console.error('Send email error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to send email',
    });
  }
}

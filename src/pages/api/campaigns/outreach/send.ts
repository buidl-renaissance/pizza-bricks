import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import { getCampaignOutreach, updateCampaignOutreach } from '@/db/campaigns';
import { insertActivityEvent } from '@/db/ops';
import { sendEmail, isGmailConfigured } from '@/lib/gmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { outreachId } = req.body;
  if (!outreachId || typeof outreachId !== 'string') {
    return res.status(400).json({ error: 'outreachId is required' });
  }

  if (!isGmailConfigured()) {
    return res.status(401).json({ code: 'GMAIL_NOT_CONFIGURED', error: 'Gmail not connected' });
  }

  const outreach = await getCampaignOutreach(outreachId);
  if (!outreach) return res.status(404).json({ error: 'Outreach not found' });
  if (outreach.status !== 'draft') {
    return res.status(400).json({ error: `Outreach status is ${outreach.status}, cannot send` });
  }
  if (outreach.channel !== 'email') {
    return res.status(400).json({ error: 'Only email outreach can be sent' });
  }
  if (!outreach.subject || !outreach.bodyHtml) {
    return res.status(400).json({ error: 'Outreach missing subject or body' });
  }

  try {
    await sendEmail({
      to: outreach.recipient,
      subject: outreach.subject,
      bodyHtml: outreach.bodyHtml,
    });

    await updateCampaignOutreach(outreachId, { status: 'sent', sentAt: new Date() });

    await insertActivityEvent({
      type: 'campaign_outreach_sent',
      targetLabel: outreach.recipient,
      detail: `Campaign invite sent to ${outreach.recipient}`,
      status: 'completed',
      triggeredBy: 'manual',
      metadata: { campaignId: outreach.campaignId, outreachId },
    });

    return res.status(200).json({
      success: true,
      outreachId,
      sentTo: outreach.recipient,
    });
  } catch (err) {
    await updateCampaignOutreach(outreachId, { status: 'failed' });
    console.error('[campaigns/outreach/send]', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to send email',
    });
  }
}

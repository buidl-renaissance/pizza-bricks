import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';
import {
  getCampaign,
  getCampaignEventByCampaignId,
  listContributorsForCampaign,
  insertCampaignOutreach,
  insertCampaignContributorInvite,
} from '@/db/campaigns';
function buildCampaignInviteTemplate(opts: {
  campaignName: string;
  contributorName: string;
  suggestedDate?: string | null;
  suggestedTime?: string | null;
  rsvpUrl?: string | null;
}): { subject: string; bodyHtml: string; bodyText: string } {
  const { campaignName, contributorName, suggestedDate, suggestedTime, rsvpUrl } = opts;
  const dateLine = suggestedDate
    ? `Date: ${suggestedTime ? `${suggestedDate} ${suggestedTime}` : suggestedDate}`
    : '';
  const cta = rsvpUrl
    ? `RSVP here: ${rsvpUrl}`
    : "We'll send you the details soon.";
  const subject = `You're invited: ${campaignName}`;
  const bodyHtml = `
<p>Hi ${contributorName},</p>
<p>You're invited to join us for <strong>${campaignName}</strong>.</p>
${dateLine ? `<p>${dateLine}</p>` : ''}
<p>${cta}</p>
<p>Hope to see you there!</p>
`;
  const bodyText = `Hi ${contributorName},\n\nYou're invited to join us for ${campaignName}.\n${dateLine ? dateLine + '\n\n' : ''}${cta}\n\nHope to see you there!`;
  return { subject, bodyHtml, bodyText };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'Campaign id is required' });

  const campaign = await getCampaign(id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const event = await getCampaignEventByCampaignId(id);
  const rsvpUrl = event?.rsvpUrl ?? null;

  const eligible = await listContributorsForCampaign(id);
  const created: string[] = [];

  for (const contributor of eligible) {
    const { subject, bodyHtml, bodyText } = buildCampaignInviteTemplate({
      campaignName: campaign.name,
      contributorName: contributor.name,
      suggestedDate: campaign.suggestedDate,
      suggestedTime: campaign.suggestedTime,
      rsvpUrl,
    });
    const outreachId = await insertCampaignOutreach({
      campaignId: id,
      contributorId: contributor.id,
      channel: 'email',
      recipient: contributor.email!,
      status: 'draft',
      subject,
      bodyHtml,
      bodyText,
    });
    created.push(outreachId);
    await insertCampaignContributorInvite({
      campaignId: id,
      contributorId: contributor.id,
      role: contributor.role,
      status: 'pending',
    });
  }

  return res.status(200).json({
    success: true,
    campaignId: id,
    matched: eligible.length,
    created: created.length,
    outreachIds: created,
  });
}

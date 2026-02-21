import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRead } from '@/lib/ops-auth';
import { getEmailStats, getSiteStats } from '@/db/ops';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireRead(req, res)) return;

  const [email, sites] = await Promise.all([getEmailStats(), getSiteStats()]);
  const openRate = email.sent > 0 ? Math.round((email.opened / email.sent) * 100) : 0;
  const replyRate = email.sent > 0 ? Math.round((email.replied / email.sent) * 100) : 0;

  return res.status(200).json({
    email: { ...email, openRate, replyRate },
    sites,
    chatbot: { conversations: 0, leads: 0, conversionRate: 0 }, // placeholder
  });
}

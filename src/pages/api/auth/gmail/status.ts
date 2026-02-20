import type { NextApiRequest, NextApiResponse } from 'next';
import { isGmailConfigured, getSenderEmail } from '@/lib/gmail';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  if (!isGmailConfigured()) {
    return res.status(200).json({ connected: false });
  }

  try {
    const account = await getSenderEmail();
    return res.status(200).json({ connected: true, account });
  } catch (err) {
    console.error('Gmail status check failed:', err);
    return res.status(200).json({ connected: false, error: 'Token may be expired' });
  }
}

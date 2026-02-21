import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * GET /api/auth/resend/status
 * Returns whether Resend is configured (RESEND_API_KEY set).
 * Used by outreach UI to show "Email via Resend" state.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(200).json({
    configured: !!process.env.RESEND_API_KEY,
  });
}

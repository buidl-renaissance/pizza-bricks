import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

function getRedirectUri(req: NextApiRequest) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost:3000';
  return `${proto}://${host}/api/auth/gmail/callback`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in .env' });
  }

  const redirectUri = getRedirectUri(req);
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  res.redirect(authUrl);
}

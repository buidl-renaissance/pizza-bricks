import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(process.cwd(), '.gmail-credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

function getRedirectUri(req: NextApiRequest) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost:3000';
  return `${proto}://${host}/api/auth/gmail/callback`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string;
  const error = req.query.error as string;

  if (error) {
    return res.redirect('/outreach?gmail_auth=error&reason=' + encodeURIComponent(error));
  }

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const clientId = process.env.GMAIL_CLIENT_ID!;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET!;
  const redirectUri = getRedirectUri(req);

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get the authenticated email address
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const senderEmail = profile.data.emailAddress || '';

    const credentials = {
      token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || '',
      token_uri: 'https://oauth2.googleapis.com/token',
      client_id: clientId,
      client_secret: clientSecret,
      scopes: SCOPES,
      universe_domain: 'googleapis.com',
      account: senderEmail,
      expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : '',
    };

    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));
    console.log(`Gmail authenticated as ${senderEmail}`);

    res.redirect('/outreach?gmail_auth=success&account=' + encodeURIComponent(senderEmail));
  } catch (err) {
    console.error('Gmail OAuth callback error:', err);
    const message = err instanceof Error ? err.message : 'OAuth failed';
    res.redirect('/outreach?gmail_auth=error&reason=' + encodeURIComponent(message));
  }
}

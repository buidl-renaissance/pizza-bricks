import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(process.cwd(), '.gmail-credentials.json');

interface GmailCredentials {
  token: string;
  refresh_token: string;
  token_uri: string;
  client_id: string;
  client_secret: string;
  scopes: string[];
  account: string;
  expiry: string;
}

function loadCredentials(): GmailCredentials {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error('Gmail not authenticated. Run `npm run gmail-setup` first.');
  }
  return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
}

function getGmailClient() {
  const creds = loadCredentials();

  const oauth2Client = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
  );

  oauth2Client.setCredentials({
    refresh_token: creds.refresh_token,
    access_token: creds.token,
    expiry_date: creds.expiry ? new Date(creds.expiry).getTime() : undefined,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function getSenderEmail(): Promise<string> {
  const creds = loadCredentials();
  if (creds.account) return creds.account;

  const gmail = getGmailClient();
  const profile = await gmail.users.getProfile({ userId: 'me' });
  return profile.data.emailAddress || '';
}

export function isGmailConfigured(): boolean {
  try {
    loadCredentials();
    return true;
  } catch {
    return false;
  }
}

interface SendEmailOptions {
  to: string;
  subject: string;
  bodyHtml: string;
}

function buildRawEmail(from: string, to: string, subject: string, bodyHtml: string): string {
  const boundary = `boundary_${Date.now()}`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(bodyHtml).toString('base64'),
    '',
    `--${boundary}--`,
  ];

  return Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendEmail(options: SendEmailOptions): Promise<{ messageId: string }> {
  const gmail = getGmailClient();
  const senderEmail = await getSenderEmail();
  const raw = buildRawEmail(senderEmail, options.to, options.subject, options.bodyHtml);

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  const messageId = response.data.id;
  if (!messageId) throw new Error('Gmail API did not return a message ID');

  console.log(`Email sent to ${options.to}, messageId=${messageId}`);
  return { messageId };
}

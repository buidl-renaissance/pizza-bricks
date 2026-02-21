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
  /** Gmail thread ID — keeps the reply in the same conversation */
  threadId?: string;
  /** RFC 2822 Message-ID of the message being replied to */
  inReplyTo?: string;
}

/** RFC 2047 Base64-encode a header value so non-ASCII chars survive MIME transport */
function encodeHeader(value: string): string {
  if (/[^\x00-\x7F]/.test(value)) {
    return `=?UTF-8?B?${Buffer.from(value, 'utf-8').toString('base64')}?=`;
  }
  return value;
}

function buildRawEmail(
  from: string,
  to: string,
  subject: string,
  bodyHtml: string,
  inReplyTo?: string,
): string {
  const boundary = `boundary_${Date.now()}`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    ...(inReplyTo ? [
      // inReplyTo may already be wrapped in <>, so normalise first
      `In-Reply-To: ${inReplyTo.startsWith('<') ? inReplyTo : `<${inReplyTo}>`}`,
      `References: ${inReplyTo.startsWith('<') ? inReplyTo : `<${inReplyTo}>`}`,
    ] : []),
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

export async function sendEmail(
  options: SendEmailOptions
): Promise<{ messageId: string; threadId: string }> {
  const gmail = getGmailClient();
  const senderEmail = await getSenderEmail();

  // Demo override: redirect all outgoing emails to a fixed address
  const demoRecipient = process.env.DEMO_EMAIL_RECIPIENT;
  const actualTo = demoRecipient || options.to;
  if (demoRecipient) {
    console.log(`[DEMO] Redirecting email from "${options.to}" → "${demoRecipient}"`);
  }

  const raw = buildRawEmail(senderEmail, actualTo, options.subject, options.bodyHtml, options.inReplyTo);

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw,
      ...(options.threadId ? { threadId: options.threadId } : {}),
    },
  });

  const messageId = response.data.id;
  const threadId = response.data.threadId;
  if (!messageId || !threadId) throw new Error('Gmail API did not return a message/thread ID');

  console.log(`Email sent to ${actualTo}, messageId=${messageId}, threadId=${threadId}`);
  return { messageId, threadId };
}

export interface InboxReply {
  gmailMessageId: string;
  gmailThreadId: string;
  /** RFC 2822 Message-ID header value, e.g. "<CABcde...@mail.gmail.com>" */
  rfcMessageId: string | null;
  fromEmail: string;
  subject: string;
  bodyText: string;
  receivedAt: Date;
}

/** Decode a base64url-encoded Gmail body part */
function decodeBody(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/** Extract plain-text body from a Gmail message payload */
function extractPlainText(payload: import('googleapis').gmail_v1.Schema$MessagePart): string {
  if (!payload) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBody(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractPlainText(part);
      if (text) return text;
    }
  }
  return '';
}

/**
 * Given a list of Gmail thread IDs we sent emails to, fetch any replies
 * (messages in those threads that were NOT sent by us).
 */
export async function fetchThreadReplies(threadIds: string[]): Promise<InboxReply[]> {
  if (threadIds.length === 0) return [];

  const gmail = getGmailClient();
  const senderEmail = await getSenderEmail();
  const replies: InboxReply[] = [];

  await Promise.all(
    threadIds.map(async (threadId) => {
      try {
        const thread = await gmail.users.threads.get({
          userId: 'me',
          id: threadId,
          format: 'full',
        });

        const messages = thread.data.messages || [];
        for (const msg of messages) {
          const headers = msg.payload?.headers || [];
          const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
          const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
          const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';
          const rfcMessageId = headers.find(h => h.name?.toLowerCase() === 'message-id')?.value ?? null;

          // Skip messages sent by us
          if (fromHeader.includes(senderEmail)) continue;

          const bodyText = extractPlainText(msg.payload || {});
          const receivedAt = dateHeader ? new Date(dateHeader) : new Date();

          replies.push({
            gmailMessageId: msg.id!,
            gmailThreadId: threadId,
            rfcMessageId,
            fromEmail: fromHeader,
            subject: subjectHeader,
            bodyText,
            receivedAt: isNaN(receivedAt.getTime()) ? new Date() : receivedAt,
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch thread ${threadId}:`, err);
      }
    })
  );

  return replies;
}

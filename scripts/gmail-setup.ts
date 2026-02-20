/**
 * Gmail OAuth setup script.
 * Run with: npm run gmail-setup
 *
 * Opens a browser for Google login, then saves credentials
 * to .gmail-credentials.json in the standard Google auth format.
 */

import { google } from 'googleapis';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const CREDENTIALS_PATH = path.join(process.cwd(), '.gmail-credentials.json');
const REDIRECT_PORT = 3456;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('\n  === Gmail OAuth Setup ===\n');

  // Check for existing credentials
  if (fs.existsSync(CREDENTIALS_PATH)) {
    const existing = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    if (existing.refresh_token) {
      console.log(`  Existing credentials found (account: ${existing.account || 'unknown'})`);
      const answer = await prompt('  Re-authenticate? (y/N) ');
      if (answer.toLowerCase() !== 'y') {
        console.log('  Keeping existing credentials.\n');
        process.exit(0);
      }
    }
  }

  const clientId = await prompt('  Google OAuth Client ID: ');
  if (!clientId) {
    console.error('\n  Client ID is required.');
    console.error('  Create OAuth 2.0 credentials at: https://console.cloud.google.com/apis/credentials');
    console.error('  Set the redirect URI to: ' + REDIRECT_URI + '\n');
    process.exit(1);
  }

  const clientSecret = await prompt('  Google OAuth Client Secret: ');
  if (!clientSecret) {
    console.error('\n  Client Secret is required.\n');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n  Opening browser for Google login...\n');

  try {
    const platform = process.platform;
    if (platform === 'darwin') execSync(`open "${authUrl}"`);
    else if (platform === 'win32') execSync(`start "" "${authUrl}"`);
    else execSync(`xdg-open "${authUrl}" 2>/dev/null || wslview "${authUrl}" 2>/dev/null || true`);
  } catch { /* browser open is best-effort */ }

  console.log('  If the browser did not open, visit this URL:\n');
  console.log(`  ${authUrl}\n`);
  console.log('  Waiting for authentication...\n');

  const code = await waitForCallback();

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get sender email
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

  console.log(`  Authenticated as: ${senderEmail}`);
  console.log(`  Credentials saved to: .gmail-credentials.json`);
  console.log('\n  Gmail is ready to use!\n');
  process.exit(0);
}

function waitForCallback(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '', `http://localhost:${REDIRECT_PORT}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h2>Authentication failed.</h2><p>You can close this tab.</p>');
        server.close();
        reject(new Error(`Auth error: ${error}`));
        return;
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h2>Authentication successful!</h2><p>You can close this tab and return to the terminal.</p>');
        server.close();
        resolve(code);
      }
    });

    server.listen(REDIRECT_PORT, () => {});
    server.on('error', (err) => {
      reject(new Error(`Could not start callback server on port ${REDIRECT_PORT}: ${err.message}`));
    });
  });
}

main().catch(err => {
  console.error('Gmail setup failed:', err.message);
  process.exit(1);
});

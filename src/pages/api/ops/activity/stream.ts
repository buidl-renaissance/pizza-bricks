import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { requireAdmin } from '@/lib/ops-auth';
import { getRecentActivityEvents } from '@/db/ops';
import { addSseClient, removeSseClient, sendSseEvent, sendSsePing } from '@/lib/sse-broadcast';

// Disable body parsing for SSE
export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireAdmin(req, res)) return;

  const clientId = uuidv4();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send 5-event catch-up
  const recent = await getRecentActivityEvents(5);
  for (const event of [...recent].reverse()) {
    sendSseEvent(res, event);
  }

  addSseClient(clientId, res as unknown as import('http').ServerResponse);

  // Keepalive ping every 25s
  const pingInterval = setInterval(() => sendSsePing(res as unknown as import('http').ServerResponse), 25000);

  req.on('close', () => {
    clearInterval(pingInterval);
    removeSseClient(clientId);
  });
}

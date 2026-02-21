import type { ServerResponse } from 'http';
import type { ActivityEvent } from '@/db/ops';

// Singleton SSE client registry — persists across hot reloads in Next.js dev
declare global {
  // eslint-disable-next-line no-var
  var sseClients: Map<string, ServerResponse> | undefined;
}

function getClients(): Map<string, ServerResponse> {
  if (!global.sseClients) {
    global.sseClients = new Map();
  }
  return global.sseClients;
}

export function addSseClient(id: string, res: ServerResponse): void {
  getClients().set(id, res);
}

export function removeSseClient(id: string): void {
  getClients().delete(id);
}

export function broadcastActivity(event: ActivityEvent): void {
  const clients = getClients();
  if (clients.size === 0) return;

  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const [id, res] of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(id);
    }
  }
}

export function sendSseEvent(res: ServerResponse, event: ActivityEvent): void {
  try {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  } catch {
    // connection closed
  }
}

export function sendSsePing(res: ServerResponse): void {
  try {
    res.write(': ping\n\n');
  } catch {
    // connection closed
  }
}

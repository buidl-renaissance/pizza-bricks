import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/ops-auth';

const VERCEL_API = 'https://api.vercel.com';

function buildHeaders() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error('VERCEL_TOKEN not set');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function buildUrl(path: string) {
  const teamId = process.env.VERCEL_TEAM_ID;
  const url = new URL(`${VERCEL_API}${path}`);
  if (teamId) url.searchParams.set('teamId', teamId);
  return url.toString();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const { projectIds } = req.body as { projectIds?: string[] };
  if (!projectIds?.length) return res.status(400).json({ error: 'projectIds required' });

  const results: Record<string, string> = {};
  for (const projectId of projectIds) {
    try {
      const r = await fetch(buildUrl(`/v9/projects/${projectId}`), {
        method: 'PATCH',
        headers: buildHeaders(),
        body: JSON.stringify({ ssoProtection: null }),
      });
      results[projectId] = r.ok ? 'ok' : `error ${r.status}`;
    } catch (e) {
      results[projectId] = e instanceof Error ? e.message : 'unknown error';
    }
  }

  return res.status(200).json({ success: true, results });
}

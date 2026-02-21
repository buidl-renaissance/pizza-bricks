import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById } from '@/db/user';

type AdminUser = {
  id: string;
  role: string;
  username?: string | null;
  email?: string | null;
};

/**
 * Allows all requests through — used for read-only public ops endpoints.
 * Always returns a synthetic public user so callers don't need null-checks.
 */
export async function requireRead(
  _req: NextApiRequest,
  _res: NextApiResponse,
): Promise<{ user: AdminUser }> {
  return { user: { id: 'public', role: 'public', username: 'public' } };
}

/**
 * Checks that the incoming request has a valid admin session.
 * Returns { user } on success, or sends 401/403 and returns null.
 *
 * Set SKIP_AUTH=true in .env to bypass for local dev.
 */
export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ user: AdminUser } | null> {
  if (process.env.SKIP_AUTH === 'true') {
    return { user: { id: 'dev', role: 'admin', username: 'dev' } };
  }

  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/user_session=([^;]+)/);
  if (!sessionMatch?.[1]) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const user = await getUserById(sessionMatch[1]);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: admin role required' });
    return null;
  }

  return { user: { id: user.id, role: user.role, username: user.username, email: user.email } };
}

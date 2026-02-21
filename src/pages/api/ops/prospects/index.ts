import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRead } from '@/lib/ops-auth';
import { listProspects } from '@/db/ops';
import type { PipelineStage, ProspectType } from '@/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireRead(req, res)) return;

  const { stage, type, limit = '50', offset = '0' } = req.query;
  const prospects = await listProspects({
    stage: stage as PipelineStage | undefined,
    type: type as ProspectType | undefined,
    limit: Number(limit),
    offset: Number(offset),
  });
  return res.status(200).json({ prospects });
}

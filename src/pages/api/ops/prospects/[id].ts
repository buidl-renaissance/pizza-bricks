import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRead } from '@/lib/ops-auth';
import { getProspect, updateProspectStage, insertActivityEvent } from '@/db/ops';
import type { PipelineStage } from '@/db/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!await requireRead(req, res)) return;
  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const prospect = await getProspect(id);
    if (!prospect) return res.status(404).json({ error: 'Prospect not found' });
    return res.status(200).json({ prospect });
  }

  if (req.method === 'PATCH') {
    const { pipelineStage } = req.body as { pipelineStage?: PipelineStage };
    if (!pipelineStage) return res.status(400).json({ error: 'pipelineStage required' });

    const prospect = await getProspect(id);
    if (!prospect) return res.status(404).json({ error: 'Prospect not found' });

    await updateProspectStage(id, pipelineStage);
    await insertActivityEvent({
      type: 'manual_action',
      prospectId: id,
      targetLabel: prospect.name,
      detail: `Stage manually changed from ${prospect.pipelineStage} → ${pipelineStage}`,
      status: 'completed',
      triggeredBy: 'manual',
    });

    return res.status(200).json({ success: true, pipelineStage });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

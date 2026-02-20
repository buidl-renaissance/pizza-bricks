import React, { useState } from 'react';
import styled from 'styled-components';
import { useProspects } from '@/hooks/useOpsData';
import type { PipelineStage } from '@/db/schema';
import type { Prospect } from '@/db/ops';

const STAGES: PipelineStage[] = ['discovered', 'contacted', 'engaged', 'onboarding', 'converted', 'churned'];

const STAGE_COLORS: Record<PipelineStage, string> = {
  discovered: '#7B5CFF',
  contacted: '#3B82F6',
  engaged: '#06B6D4',
  onboarding: '#F59E0B',
  converted: '#22C55E',
  churned: '#6B7280',
};

const Board = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
`;

const Column = styled.div`
  min-width: 200px;
  flex-shrink: 0;
`;

const ColumnHeader = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: ${({ $color }) => `${$color}18`};
  border: 1px solid ${({ $color }) => `${$color}44`};
`;

const StageLabel = styled.span<{ $color: string }>`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;
  letter-spacing: 0.04em;
  color: ${({ $color }) => $color};
`;

const CountBadge = styled.span`
  margin-left: auto;
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.textMuted};
`;

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProspectCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 0.875rem;
  cursor: pointer;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const ProspectName = styled.p`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.25rem;
`;

const ProspectMeta = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

const TypeBadge = styled.span`
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.textMuted};
  text-transform: capitalize;
`;

const StageSelect = styled.select`
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.25rem 0.5rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  color: ${({ theme }) => theme.text};
  font-size: 0.72rem;
  cursor: pointer;
`;

function ProspectCardItem({ prospect, onStageChange }: { prospect: Prospect; onStageChange: (id: string, stage: PipelineStage) => void }) {
  const [expanded, setExpanded] = useState(false);

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stage = e.target.value as PipelineStage;
    await fetch(`/api/ops/prospects/${prospect.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipelineStage: stage }),
    });
    onStageChange(prospect.id, stage);
  };

  return (
    <ProspectCard onClick={() => setExpanded(x => !x)}>
      <ProspectName>{prospect.name}</ProspectName>
      <ProspectMeta>
        <TypeBadge>{prospect.type}</TypeBadge>
        {prospect.city && ` · ${prospect.city}`}
      </ProspectMeta>
      {prospect.email && <ProspectMeta style={{ marginTop: 4 }}>{prospect.email}</ProspectMeta>}
      {expanded && (
        <StageSelect
          value={prospect.pipelineStage}
          onClick={e => e.stopPropagation()}
          onChange={handleStageChange}
        >
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </StageSelect>
      )}
    </ProspectCard>
  );
}

export function PipelineTab() {
  const { prospects, reload } = useProspects({ limit: 200 });
  const [localProspects, setLocalProspects] = React.useState<Prospect[]>([]);

  React.useEffect(() => {
    setLocalProspects(prospects);
  }, [prospects]);

  const handleStageChange = (id: string, stage: PipelineStage) => {
    setLocalProspects(prev =>
      prev.map(p => p.id === id ? { ...p, pipelineStage: stage } : p)
    );
  };

  return (
    <Board>
      {STAGES.map(stage => {
        const stageProspects = localProspects.filter(p => p.pipelineStage === stage);
        return (
          <Column key={stage}>
            <ColumnHeader $color={STAGE_COLORS[stage]}>
              <StageLabel $color={STAGE_COLORS[stage]}>{stage}</StageLabel>
              <CountBadge>{stageProspects.length}</CountBadge>
            </ColumnHeader>
            <Cards>
              {stageProspects.map(p => (
                <ProspectCardItem key={p.id} prospect={p} onStageChange={handleStageChange} />
              ))}
            </Cards>
          </Column>
        );
      })}
    </Board>
  );
}

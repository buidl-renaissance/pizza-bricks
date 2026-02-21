import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styled, { keyframes } from 'styled-components';
import { useProspects, useSites } from '@/hooks/useOpsData';
import type { PipelineStage } from '@/db/schema';
import type { Prospect, GeneratedSite } from '@/db/ops';
import type { EnrichedSite } from '@/hooks/useOpsData';

const STAGES: PipelineStage[] = ['discovered', 'contacted', 'engaged', 'onboarding', 'converted', 'churned'];

const STAGE_COLORS: Record<PipelineStage, string> = {
  discovered: '#7B5CFF',
  contacted:  '#3B82F6',
  engaged:    '#06B6D4',
  onboarding: '#F59E0B',
  converted:  '#22C55E',
  churned:    '#6B7280',
};

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

// ── Layout ────────────────────────────────────────────────────────────────────

const Board = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
`;

const Column = styled.div`
  min-width: 210px;
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

// ── Prospect Card ─────────────────────────────────────────────────────────────

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 0.875rem;
  cursor: pointer;
  transition: border-color 0.15s ease;
  &:hover { border-color: ${({ theme }) => theme.accent}; }
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

const Divider = styled.div`
  margin: 0.625rem 0;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

// ── Site Status on card ────────────────────────────────────────────────────────

const SiteRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const SiteStatusDot = styled.span<{ $status: string }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ theme, $status }) =>
    $status === 'published' ? theme.success :
    $status === 'generating' ? theme.accent :
    $status === 'revision_requested' ? theme.danger :
    theme.warning};
  ${({ $status }) => $status === 'generating' && `animation: ${spin} 1s linear infinite;`}
`;

const SiteStatusLabel = styled.span<{ $status: string }>`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ theme, $status }) =>
    $status === 'published' ? theme.success :
    $status === 'generating' ? theme.accent :
    $status === 'revision_requested' ? theme.danger :
    theme.warning};
  flex: 1;
`;

const ViewBtn = styled.a`
  font-size: 0.68rem;
  font-weight: 700;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  padding: 0.15rem 0.5rem;
  border: 1px solid ${({ theme }) => theme.accent};
  border-radius: 4px;
  transition: all 0.12s ease;
  &:hover { background: ${({ theme }) => theme.accentMuted}; }
`;

const GenBtn = styled.button<{ $loading?: boolean }>`
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.35rem;
  background: transparent;
  border: 1px dashed ${({ theme }) => theme.border};
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
  cursor: ${({ $loading }) => $loading ? 'wait' : 'pointer'};
  transition: all 0.12s ease;
  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
  }
  &:disabled { opacity: 0.6; }
`;

const SyncDeployButton = styled.button`
  padding: 0.4rem 0.9rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.background};
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.7; cursor: wait; }
`;

const OutreachLink = styled(Link)`
  padding: 0.4rem 0.9rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  &:hover { border-color: ${({ theme }) => theme.accent}; color: ${({ theme }) => theme.accent}; }
`;

// STATUS_LABELS for card badge
const STATUS_LABELS: Record<string, string> = {
  generating: 'Generating…',
  pending_review: 'Pending Review',
  published: 'Published',
  revision_requested: 'Revision Needed',
  archived: 'Archived',
};

// ── Card with site awareness ──────────────────────────────────────────────────

interface ProspectCardProps {
  prospect: Prospect;
  site: EnrichedSite | undefined;
  onStageChange: (id: string, stage: PipelineStage) => void;
  onSiteGenerated: () => void;
}

function ProspectCardItem({ prospect, site, onStageChange, onSiteGenerated }: ProspectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  // Poll site state if generating
  const [polledSite, setPolledSite] = useState<EnrichedSite | null>(null);

  const currentSite = polledSite ?? site;

  // Poll while generating
  useEffect(() => {
    if (!currentSite || currentSite.status !== 'generating') return;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/ops/sites/${currentSite.id}`);
      if (res.ok) {
        const d = await res.json() as { site: EnrichedSite };
        setPolledSite(d.site);
        if (d.site.status !== 'generating') onSiteGenerated();
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [currentSite, onSiteGenerated]);

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stage = e.target.value as PipelineStage;
    await fetch(`/api/ops/prospects/${prospect.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipelineStage: stage }),
    });
    onStageChange(prospect.id, stage);
  };

  const handleGenerateSite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setGenerating(true);
    try {
      const res = await fetch('/api/ops/actions/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_site', prospectId: prospect.id }),
      });
      if (res.ok) {
        // Refresh to pick up the new generating record
        setTimeout(onSiteGenerated, 800);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card onClick={() => setExpanded(x => !x)}>
      <ProspectName>{prospect.name}</ProspectName>
      <ProspectMeta>
        <TypeBadge>{prospect.type}</TypeBadge>
        {prospect.city && ` · ${prospect.city}`}
      </ProspectMeta>
      {prospect.email && <ProspectMeta style={{ marginTop: 4 }}>{prospect.email}</ProspectMeta>}

      {/* Site status badge */}
      {currentSite && (
        <SiteRow>
          <SiteStatusDot $status={currentSite.status} />
          <SiteStatusLabel $status={currentSite.status}>
            {STATUS_LABELS[currentSite.status] ?? currentSite.status}
          </SiteStatusLabel>
          {currentSite.url && (
            <ViewBtn
              href={currentSite.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
            >
              View ↗
            </ViewBtn>
          )}
        </SiteRow>
      )}

      {expanded && (
        <>
          <Divider />
          <StageSelect
            value={prospect.pipelineStage}
            onClick={e => e.stopPropagation()}
            onChange={handleStageChange}
          >
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </StageSelect>

          {!currentSite && (
            <GenBtn
              $loading={generating}
              disabled={generating}
              onClick={handleGenerateSite}
            >
              {generating ? 'Starting…' : '+ Generate Site'}
            </GenBtn>
          )}
        </>
      )}
    </Card>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

export function PipelineTab() {
  const { prospects, reload: reloadProspects } = useProspects({ limit: 200 });
  const { sites, reload: reloadSites } = useSites();
  const [localProspects, setLocalProspects] = useState<Prospect[]>([]);

  useEffect(() => { setLocalProspects(prospects); }, [prospects]);

  // Map prospectId → latest site
  const siteByProspect = React.useMemo(() => {
    const map = new Map<string, EnrichedSite>();
    for (const s of sites) {
      const existing = map.get(s.prospectId);
      // Prefer non-archived, most recent
      if (!existing || new Date(s.generatedAt) > new Date(existing.generatedAt)) {
        map.set(s.prospectId, s);
      }
    }
    return map;
  }, [sites]);

  const handleStageChange = (id: string, stage: PipelineStage) => {
    setLocalProspects(prev => prev.map(p => p.id === id ? { ...p, pipelineStage: stage } : p));
  };

  const handleSiteUpdate = useCallback(() => {
    reloadSites();
  }, [reloadSites]);

  const [syncLoading, setSyncLoading] = useState(false);
  const handleSyncDeployments = useCallback(async () => {
    setSyncLoading(true);
    try {
      await fetch('/api/ops/deployments/sync', { method: 'POST' });
      await reloadSites();
    } finally {
      setSyncLoading(false);
    }
  }, [reloadSites]);

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <SyncDeployButton type="button" onClick={handleSyncDeployments} disabled={syncLoading}>
          {syncLoading ? 'Syncing…' : 'Sync deployment status'}
        </SyncDeployButton>
        <OutreachLink href="/outreach">Discover & outreach</OutreachLink>
      </div>
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
                <ProspectCardItem
                  key={p.id}
                  prospect={p}
                  site={siteByProspect.get(p.id)}
                  onStageChange={handleStageChange}
                  onSiteGenerated={handleSiteUpdate}
                />
              ))}
            </Cards>
          </Column>
        );
      })}
    </Board>
    </div>
  );
}

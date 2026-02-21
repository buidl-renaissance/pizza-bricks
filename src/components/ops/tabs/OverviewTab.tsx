import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { MetricCard } from '../shared/MetricCard';
import { AgentStatusBadge } from '../shared/AgentStatusBadge';
import { AlertsList } from '../shared/AlertsList';
import { PipelineFunnel } from '../shared/PipelineFunnel';
import { ActivityCard } from '../shared/ActivityCard';
import { useMetrics, usePipelineSummary, useAlerts, useAgentState } from '@/hooks/useOpsData';
import { useActivityStream } from '@/hooks/useActivityStream';

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 0.875rem;
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.875rem;
`;

const AgentRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
`;

const AgentLabel = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const LiveDot = styled.span`
  margin-left: auto;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textMuted};
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SyncRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
`;

const SyncButton = styled.button<{ $loading?: boolean }>`
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.background};
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: 6px;
  cursor: ${({ $loading }) => ($loading ? 'wait' : 'pointer')};
  opacity: ${({ $loading }) => ($loading ? 0.8 : 1)};
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
  }
  &:disabled {
    cursor: not-allowed;
  }
`;

const SyncSummary = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
`;

export function OverviewTab() {
  const { data: metrics, loading: metricsLoading } = useMetrics();
  const { data: stages, loading: stagesLoading } = usePipelineSummary();
  const { alerts } = useAlerts();
  const { state: agent, loading: agentLoading, pause, resume } = useAgentState();
  const { events, connected } = useActivityStream(10);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSummary, setSyncSummary] = useState<{
    checked: number;
    updated: number;
    failed: number;
    stillPending: number;
  } | null>(null);

  const runSync = useCallback(async () => {
    setSyncLoading(true);
    setSyncSummary(null);
    try {
      const res = await fetch('/api/ops/deployments/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.summary) setSyncSummary(data.summary);
    } finally {
      setSyncLoading(false);
    }
  }, []);

  return (
    <div>
      <Section>
        <SectionTitle>Deployment Status</SectionTitle>
        <SyncRow>
          <SyncButton type="button" onClick={runSync} disabled={syncLoading} $loading={syncLoading}>
            {syncLoading ? 'Syncing…' : 'Sync deployment status'}
          </SyncButton>
          {syncSummary && (
            <SyncSummary>
              Checked {syncSummary.checked}, {syncSummary.updated} updated, {syncSummary.failed} failed
              {syncSummary.stillPending > 0 ? `, ${syncSummary.stillPending} still building` : ''}.
            </SyncSummary>
          )}
        </SyncRow>
      </Section>

      <Section>
        <SectionTitle>Agent Status</SectionTitle>
        <AgentRow>
          <AgentLabel>Growth Agent</AgentLabel>
          <AgentStatusBadge
            status={agent?.status ?? 'paused'}
            onPause={pause}
            onResume={resume}
            loading={agentLoading}
          />
          <LiveDot>{connected ? '● Live' : '○ Disconnected'}</LiveDot>
        </AgentRow>
      </Section>

      <Section>
        <SectionTitle>Metrics</SectionTitle>
        <MetricGrid>
          <MetricCard label="Total Prospects" value={metricsLoading ? '—' : metrics?.totalProspects ?? 0} />
          <MetricCard label="Contacted" value={metricsLoading ? '—' : metrics?.contacted ?? 0} />
          <MetricCard label="Converted" value={metricsLoading ? '—' : metrics?.converted ?? 0} />
          <MetricCard label="Active Sites" value={metricsLoading ? '—' : metrics?.activeSites ?? 0} />
        </MetricGrid>
      </Section>

      <Section>
        <SectionTitle>Pipeline Funnel</SectionTitle>
        {!stagesLoading && <PipelineFunnel stages={stages} />}
      </Section>

      <Section>
        <SectionTitle>Active Alerts</SectionTitle>
        <AlertsList alerts={alerts} />
      </Section>

      <Section>
        <SectionTitle>Live Activity</SectionTitle>
        <ActivityList>
          {events.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted, #6B7280)', margin: 0 }}>
              No recent activity.
            </p>
          ) : (
            events.map(e => <ActivityCard key={e.id} event={e} />)
          )}
        </ActivityList>
      </Section>
    </div>
  );
}

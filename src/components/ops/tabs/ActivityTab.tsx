import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { FilterBar, type FilterValue } from '../shared/FilterBar';
import { ActivityCard } from '../shared/ActivityCard';
import { ActionModal, type ActionDef } from '../shared/ActionModal';
import { useActivityLog } from '@/hooks/useOpsData';
import { useActivityStream } from '@/hooks/useActivityStream';
import type { ActivityEvent } from '@/db/ops';
import type { ActivityEventType } from '@/db/schema';

const ACTIONS: ActionDef[] = [
  { action: 'discover_prospects', label: 'Discover Prospects', description: 'Run the discovery workflow to find 1–3 new food vendor prospects in the Detroit metro area.' },
  { action: 'send_outreach', label: 'Send Outreach Email', description: 'Send cold outreach emails to all newly-discovered prospects that have email addresses. Or send to a specific prospect.', requiresProspectId: false },
  { action: 'run_followups', label: 'Run Follow-ups', description: 'Trigger the follow-up sequence for all prospects whose last email is overdue for a next step.' },
  { action: 'generate_site', label: 'Generate Site', description: 'Generate and deploy a website for a specific prospect via the site pipeline.', requiresProspectId: true },
  { action: 'simulate_reply', label: 'Simulate Reply', description: 'Process a simulated reply from a prospect (use the latest unreplied email). Parses intent and pushes through pipeline.', requiresProspectId: true, requiresBody: true },
  { action: 'run_full_tick', label: 'Run Full Agent Tick', description: 'Run all agent workflows (discovery → outreach → follow-ups) in sequence, as if the cron fired.' },
];

const FILTER_TYPE_MAP: Record<Exclude<FilterValue, ''>, ActivityEventType[]> = {
  email: ['email_sent', 'email_opened', 'email_replied', 'email_bounced', 'follow_up_triggered', 'reply_intent_parsed', 'marketing_materials_requested', 'event_influencer_requested'],
  site: ['site_generated', 'site_published', 'site_viewed'],
  discovery: ['prospect_discovered', 'prospect_batch_scraped'],
  onboarding: ['onboarding_started', 'wallet_setup', 'onboarding_completed'],
  error: ['agent_error'],
  manual: [], // filtered by triggeredBy in component
};

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const LiveIndicator = styled.span<{ $connected: boolean }>`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ theme, $connected }) => $connected ? theme.success : theme.textMuted};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const LoadMore = styled.button`
  margin-top: 0.75rem;
  width: 100%;
  padding: 0.6rem;
  background: transparent;
  border: 1px dashed ${({ theme }) => theme.border};
  border-radius: 6px;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover { border-color: ${({ theme }) => theme.accent}; color: ${({ theme }) => theme.accent}; }
`;

const SectionTitle = styled.h2`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 0.875rem;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ActionCard = styled.button`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    background: ${({ theme }) => theme.surfaceHover};
    transform: translateY(-1px);
  }
`;

const ActionLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
`;

const ActionDesc = styled.span`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textMuted};
  line-height: 1.45;
`;

const RunBtn = styled.span`
  margin-top: auto;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
`;

function dedup(events: ActivityEvent[]): ActivityEvent[] {
  const seen = new Set<string>();
  return events.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export function ActivityTab() {
  const [filter, setFilter] = useState<FilterValue>('');
  const [limit, setLimit] = useState(50);
  const [activeAction, setActiveAction] = useState<ActionDef | null>(null);
  const { events: logEvents, loading, reload } = useActivityLog({
    limit,
    triggeredBy: filter === 'manual' ? 'manual' : undefined,
  });
  const { events: liveEvents, connected } = useActivityStream(20);

  const merged = useMemo(() => {
    return dedup([...liveEvents, ...logEvents]);
  }, [liveEvents, logEvents]);

  const filtered = useMemo(() => {
    if (!filter) return merged;
    if (filter === 'manual') return merged.filter(e => e.triggeredBy === 'manual');
    const types = FILTER_TYPE_MAP[filter as keyof typeof FILTER_TYPE_MAP] ?? [];
    return merged.filter(e => types.includes(e.type as ActivityEventType));
  }, [merged, filter]);

  return (
    <div>
      <SectionTitle>Quick Actions</SectionTitle>
      <ActionsGrid>
        {ACTIONS.map(a => (
          <ActionCard key={a.action} onClick={() => setActiveAction(a)}>
            <ActionLabel>{a.label}</ActionLabel>
            <ActionDesc>{a.description}</ActionDesc>
            <RunBtn>Run &rarr;</RunBtn>
          </ActionCard>
        ))}
      </ActionsGrid>

      <Header>
        <FilterBar active={filter} onChange={setFilter} />
        <LiveIndicator $connected={connected}>
          {connected ? '● Live' : '○ Disconnected'}
        </LiveIndicator>
      </Header>

      {loading && filtered.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>No events match this filter.</p>
      ) : (
        <>
          <List>
            {filtered.map(e => <ActivityCard key={e.id} event={e} />)}
          </List>
          {logEvents.length >= limit && (
            <LoadMore onClick={() => setLimit(l => l + 50)}>Load more</LoadMore>
          )}
        </>
      )}

      {activeAction && (
        <ActionModal
          actionDef={activeAction}
          onClose={() => setActiveAction(null)}
          onSuccess={() => { reload(); setActiveAction(null); }}
        />
      )}
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { FilterBar, type FilterValue } from '../shared/FilterBar';
import { ActivityCard } from '../shared/ActivityCard';
import { useActivityLog } from '@/hooks/useOpsData';
import { useActivityStream } from '@/hooks/useActivityStream';
import type { ActivityEvent } from '@/db/ops';
import type { ActivityEventType } from '@/db/schema';

const FILTER_TYPE_MAP: Record<Exclude<FilterValue, ''>, ActivityEventType[]> = {
  email: ['email_sent', 'email_opened', 'email_replied', 'email_bounced', 'follow_up_triggered', 'reply_intent_parsed', 'marketing_materials_requested', 'event_influencer_requested'],
  site: ['site_generated', 'site_published', 'site_viewed'],
  discovery: ['prospect_discovered', 'prospect_batch_scraped'],
  onboarding: ['onboarding_started', 'wallet_setup', 'onboarding_completed'],
  error: ['agent_error'],
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
  const { events: logEvents, loading } = useActivityLog({ limit });
  const { events: liveEvents, connected } = useActivityStream(20);

  const merged = useMemo(() => {
    return dedup([...liveEvents, ...logEvents]);
  }, [liveEvents, logEvents]);

  const filtered = useMemo(() => {
    if (!filter) return merged;
    const types = FILTER_TYPE_MAP[filter as keyof typeof FILTER_TYPE_MAP] ?? [];
    return merged.filter(e => types.includes(e.type as ActivityEventType));
  }, [merged, filter]);

  return (
    <div>
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
    </div>
  );
}

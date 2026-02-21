import React, { useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { FilterBar, type FilterValue } from '../shared/FilterBar';
import { ActivityCard } from '../shared/ActivityCard';
import { ActionModal, type ActionDef } from '../shared/ActionModal';
import { SiteStatusCard } from '../shared/SiteStatusCard';
import { useActivityLog, useActivityStream, useChannelStats, useSites, useSiteStatus } from '@/hooks/useOpsData';
import type { EnrichedSite } from '@/hooks/useOpsData';
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
  manual: [],
};

// ── Layout ────────────────────────────────────────────────────────────────────

const SectionTitle = styled.h2`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 0.875rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.75rem;
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  padding: 1rem 1.25rem;
`;

const StatCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const StatCardTitle = styled.h3`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const StatRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 1rem;
`;

const StatItem = styled.div``;

const StatLabel = styled.span`
  font-size: 0.68rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const StatValue = styled.span`
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  font-variant-numeric: tabular-nums;
`;

const RatePill = styled.span<{ $good: boolean }>`
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  background: ${({ theme, $good }) => $good ? `${theme.success}22` : `${theme.warning}22`};
  color: ${({ theme, $good }) => $good ? theme.success : theme.warning};
  margin-left: 0.35rem;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.75rem;
`;

const ActionCard = styled.button`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1rem 1.1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
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
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
`;

const ActionDesc = styled.span`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.textMuted};
  line-height: 1.4;
`;

const RunHint = styled.span`
  font-size: 0.68rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  align-items: start;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ActivitySection = styled.div`
  min-width: 0;
`;

const ActivityHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const LiveIndicator = styled.span<{ $connected: boolean }>`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${({ theme, $connected }) => $connected ? theme.success : theme.textMuted};
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 520px;
  overflow-y: auto;
`;

const LoadMore = styled.button`
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  background: transparent;
  border: 1px dashed ${({ theme }) => theme.border};
  border-radius: 6px;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textMuted};
  cursor: pointer;
  &:hover { border-color: ${({ theme }) => theme.accent}; color: ${({ theme }) => theme.accent}; }
`;

const SitesSection = styled.div`
  position: sticky;
  top: 1rem;
  @media (max-width: 900px) {
    position: static;
  }
`;

const SitesHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const RefreshBtn = styled.button`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textMuted};
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  &:hover { color: ${({ theme }) => theme.text}; }
`;

const SitesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 480px;
  overflow-y: auto;
`;

const EmptyMsg = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

function dedup(events: ActivityEvent[]): ActivityEvent[] {
  const seen = new Set<string>();
  return events.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

function LiveSiteCard({ site, onDone }: { site: EnrichedSite; onDone: () => void }) {
  const needsPoll = site.status === 'generating';
  const { site: polled } = useSiteStatus(needsPoll ? site.id : null, 5000);
  const displayed = polled ?? site;

  React.useEffect(() => {
    if (polled && polled.status !== 'generating') onDone();
  }, [polled, onDone]);

  return <SiteStatusCard site={displayed} onRedeploy={onDone} />;
}

export function ActivityChannelsTab() {
  const [filter, setFilter] = useState<FilterValue>('');
  const [limit, setLimit] = useState(50);
  const [activeAction, setActiveAction] = useState<ActionDef | null>(null);

  const { data: channelStats, loading: statsLoading, reload: reloadStats } = useChannelStats();
  const { sites, loading: sitesLoading, reload: reloadSites } = useSites();
  const { events: logEvents, loading: activityLoading, reload: reloadActivity } = useActivityLog({
    limit,
    triggeredBy: filter === 'manual' ? 'manual' : undefined,
  });
  const { events: liveEvents, connected } = useActivityStream(20);

  const handleSiteDone = useCallback(() => {
    reloadSites();
    reloadStats();
  }, [reloadSites, reloadStats]);

  const merged = useMemo(() => dedup([...liveEvents, ...logEvents]), [liveEvents, logEvents]);

  const filtered = useMemo(() => {
    if (!filter) return merged;
    if (filter === 'manual') return merged.filter(e => e.triggeredBy === 'manual');
    const types = FILTER_TYPE_MAP[filter as keyof typeof FILTER_TYPE_MAP] ?? [];
    return merged.filter(e => types.includes(e.type as ActivityEventType));
  }, [merged, filter]);

  const handleActionSuccess = useCallback(() => {
    reloadActivity();
    reloadStats();
    reloadSites();
    setActiveAction(null);
  }, [reloadActivity, reloadStats, reloadSites]);

  return (
    <div>
      {/* Channel stats */}
      <SectionTitle>Channels</SectionTitle>
      {statsLoading ? (
        <EmptyMsg>Loading stats…</EmptyMsg>
      ) : (
        <StatsGrid>
          <StatCard>
            <StatCardHeader>
              <span aria-hidden>📧</span>
              <StatCardTitle>Email</StatCardTitle>
            </StatCardHeader>
            <StatRow>
              <StatItem><StatLabel>Sent</StatLabel><StatValue>{channelStats?.email.sent ?? 0}</StatValue></StatItem>
              <StatItem><StatLabel>Replies</StatLabel><StatValue>{channelStats?.email.replied ?? 0}</StatValue></StatItem>
              <StatItem><StatLabel>Open rate</StatLabel><StatValue>{channelStats?.email.openRate ?? 0}% <RatePill $good={(channelStats?.email.openRate ?? 0) >= 20}>{(channelStats?.email.openRate ?? 0) >= 20 ? 'Good' : 'Low'}</RatePill></StatValue></StatItem>
              <StatItem><StatLabel>Bounced</StatLabel><StatValue>{channelStats?.email.bounced ?? 0}</StatValue></StatItem>
            </StatRow>
          </StatCard>
          <StatCard>
            <StatCardHeader>
              <span aria-hidden>🌐</span>
              <StatCardTitle>Sites</StatCardTitle>
            </StatCardHeader>
            <StatRow>
              <StatItem><StatLabel>Total</StatLabel><StatValue>{channelStats?.sites.total ?? 0}</StatValue></StatItem>
              <StatItem><StatLabel>Published</StatLabel><StatValue>{channelStats?.sites.published ?? 0}</StatValue></StatItem>
              <StatItem><StatLabel>Generating</StatLabel><StatValue>{channelStats?.sites.generating ?? 0}</StatValue></StatItem>
            </StatRow>
          </StatCard>
          <StatCard>
            <StatCardHeader>
              <span aria-hidden>💬</span>
              <StatCardTitle>Chatbot</StatCardTitle>
            </StatCardHeader>
            <StatRow>
              <StatItem><StatLabel>Conversations</StatLabel><StatValue>{channelStats?.chatbot.conversations ?? 0}</StatValue></StatItem>
              <StatItem><StatLabel>Leads</StatLabel><StatValue>{channelStats?.chatbot.leads ?? 0}</StatValue></StatItem>
              <StatItem><StatLabel>Conversion</StatLabel><StatValue>{channelStats?.chatbot.conversionRate ?? 0}%</StatValue></StatItem>
            </StatRow>
          </StatCard>
        </StatsGrid>
      )}

      {/* Quick actions */}
      <SectionTitle>Quick Actions</SectionTitle>
      <ActionsGrid>
        {ACTIONS.map(a => (
          <ActionCard key={a.action} type="button" onClick={() => setActiveAction(a)}>
            <ActionLabel>{a.label}</ActionLabel>
            <ActionDesc>{a.description}</ActionDesc>
            <RunHint>Run →</RunHint>
          </ActionCard>
        ))}
      </ActionsGrid>

      {/* Activity + Sites side by side */}
      <SectionTitle>Activity &amp; Sites</SectionTitle>
      <MainGrid>
        <ActivitySection>
          <ActivityHeader>
            <FilterBar active={filter} onChange={setFilter} />
            <LiveIndicator $connected={connected}>{connected ? '● Live' : '○ Disconnected'}</LiveIndicator>
          </ActivityHeader>
          {activityLoading && filtered.length === 0 ? (
            <EmptyMsg>Loading activity…</EmptyMsg>
          ) : filtered.length === 0 ? (
            <EmptyMsg>No events match this filter.</EmptyMsg>
          ) : (
            <>
              <ActivityList>
                {filtered.map(e => <ActivityCard key={e.id} event={e} />)}
              </ActivityList>
              {logEvents.length >= limit && (
                <LoadMore type="button" onClick={() => setLimit(l => l + 50)}>Load more</LoadMore>
              )}
            </>
          )}
        </ActivitySection>

        <SitesSection>
          <SitesHeader>
            <StatLabel as="span">Generated Sites</StatLabel>
            <RefreshBtn type="button" onClick={reloadSites}>↻ Refresh</RefreshBtn>
          </SitesHeader>
          {sitesLoading ? (
            <EmptyMsg>Loading…</EmptyMsg>
          ) : sites.length === 0 ? (
            <EmptyMsg>No sites yet. Use Quick Actions → Generate Site.</EmptyMsg>
          ) : (
            <SitesList>
              {sites.map(s => (
                <LiveSiteCard key={s.id} site={s} onDone={handleSiteDone} />
              ))}
            </SitesList>
          )}
        </SitesSection>
      </MainGrid>

      {activeAction && (
        <ActionModal
          actionDef={activeAction}
          onClose={() => setActiveAction(null)}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}

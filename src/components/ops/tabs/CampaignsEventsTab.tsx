import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';

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

const EventGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
`;

const EventCard = styled.div`
  padding: 1.25rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
`;

const EventName = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const EventMeta = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.75rem;
`;

const EventLink = styled.a`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const ActivateButton = styled.button<{ $loading?: boolean }>`
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.background};
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: 6px;
  cursor: ${({ $loading }) => ($loading ? 'wait' : 'pointer')};
  &:hover:not(:disabled) { background: ${({ theme }) => theme.accentHover}; }
`;

const EmptyState = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

interface CampaignEvent {
  id: string;
  campaignId: string;
  publishedEventId: number | null;
  rsvpUrl: string | null;
  qrImageUrl: string | null;
  sourceUrl: string | null;
}

interface CampaignWithEvent {
  id: string;
  name: string;
  status: string;
  suggestedDate: string | null;
  suggestedTime: string | null;
  event?: CampaignEvent | null;
}

export function CampaignsEventsTab() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns?limit=50&includeEvents=true');
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    const activate = router.query.activate;
    const id = typeof activate === 'string' ? activate : null;
    if (!id) return;
    setActivatingId(id);
    fetch(`/api/campaigns/${id}/activate`, { method: 'POST' })
      .then(() => loadCampaigns())
      .finally(() => {
        setActivatingId(null);
        router.replace('/ops?tab=campaigns-events', undefined, { shallow: true });
      });
  }, [router.query.activate, loadCampaigns, router]);

  const handleActivate = useCallback(async (campaignId: string) => {
    setActivatingId(campaignId);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/activate`, { method: 'POST' });
      if (res.ok) await loadCampaigns();
    } finally {
      setActivatingId(null);
    }
  }, [loadCampaigns]);

  const activeOrSuggested = campaigns.filter(c => c.status === 'active' || c.status === 'suggested');

  return (
    <div>
      <Section>
        <SectionTitle>Campaign Events</SectionTitle>
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : activeOrSuggested.length === 0 ? (
          <EmptyState>No upcoming campaign events. Go to Suggest Campaign to create one.</EmptyState>
        ) : (
          <EventGrid>
            {activeOrSuggested.map(c => (
              <EventCard key={c.id}>
                <EventName>{c.name}</EventName>
                <EventMeta>
                  {c.suggestedDate && <div>Date: {c.suggestedDate}</div>}
                  {c.suggestedTime && <div>Time: {c.suggestedTime}</div>}
                  Status: {c.status}
                </EventMeta>
                {c.event?.rsvpUrl && (
                  <EventLink href={c.event.rsvpUrl} target="_blank" rel="noopener noreferrer">
                    RSVP Page
                  </EventLink>
                )}
                {c.status === 'suggested' && (
                  <ActivateButton
                    type="button"
                    onClick={() => handleActivate(c.id)}
                    disabled={!!activatingId}
                    $loading={activatingId === c.id}
                  >
                    {activatingId === c.id ? 'Activating…' : 'Activate'}
                  </ActivateButton>
                )}
              </EventCard>
            ))}
          </EventGrid>
        )}
      </Section>
    </div>
  );
}

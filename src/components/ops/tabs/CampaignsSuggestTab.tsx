import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import Link from 'next/link';

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

const SectionDesc = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1rem;
  line-height: 1.5;
`;

const InsightBanner = styled.div`
  padding: 1rem 1.25rem;
  background: ${({ theme }) => theme.accentMuted ?? 'rgba(196, 30, 58, 0.12)'};
  border: 1px solid ${({ theme }) => theme.accent};
  border-radius: 10px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
`;

const InsightAction = styled(Link)`
  display: inline-block;
  margin-top: 0.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const CampaignGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
`;

const CampaignCard = styled.div`
  padding: 1.25rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CampaignName = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const CampaignDesc = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
  line-height: 1.45;
  flex: 1;
`;

const CampaignMeta = styled.div`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textMuted};
`;

const ActivateButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.background};
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover {
    background: ${({ theme }) => theme.accentHover};
  }
`;

const SuggestButton = styled.button<{ $loading?: boolean }>`
  padding: 0.6rem 1.25rem;
  font-size: 0.9rem;
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
  &:disabled { cursor: not-allowed; }
`;

const EmptyState = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  suggestedDate: string | null;
  suggestedTime: string | null;
  estimatedCost: number | null;
  estimatedReach: number | null;
  requiredContributors: number | null;
  underutilizationInsight: string | null;
}

export function CampaignsSuggestTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns?status=suggested&limit=20');
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const handleSuggest = useCallback(async () => {
    setSuggesting(true);
    try {
      const res = await fetch('/api/campaigns/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (res.ok) {
        await loadCampaigns();
      }
    } finally {
      setSuggesting(false);
    }
  }, [loadCampaigns]);

  const suggestedCampaigns = campaigns.filter(c => c.status === 'suggested');
  const firstWithInsight = suggestedCampaigns.find(c => c.underutilizationInsight);

  return (
    <div>
      <Section>
        <SectionTitle>Campaigns</SectionTitle>
        <SectionDesc>Suggestions consider your local creator network to match campaigns with the right participants.</SectionDesc>
        <SuggestButton type="button" onClick={handleSuggest} disabled={suggesting} $loading={suggesting}>
          {suggesting ? 'Generating…' : 'Suggest New Campaign'}
        </SuggestButton>
      </Section>

      {firstWithInsight?.underutilizationInsight && (
        <InsightBanner>
          {firstWithInsight.underutilizationInsight}
          <InsightAction href={`/ops?tab=campaigns-events`}>
            View Upcoming Events &rarr;
          </InsightAction>
        </InsightBanner>
      )}

      <Section>
        <SectionTitle>Suggested Campaigns</SectionTitle>
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : suggestedCampaigns.length === 0 ? (
          <EmptyState>No suggested campaigns yet. Click &quot;Suggest New Campaign&quot; to get started.</EmptyState>
        ) : (
          <CampaignGrid>
            {suggestedCampaigns.map(c => (
              <CampaignCard key={c.id}>
                <CampaignName>{c.name}</CampaignName>
                <CampaignDesc>{c.description ?? ''}</CampaignDesc>
                <CampaignMeta>
                  {c.suggestedDate && <div>Date: {c.suggestedDate}</div>}
                  {c.estimatedCost != null && <div>Est. cost: ${(c.estimatedCost / 100).toFixed(0)}</div>}
                  {c.estimatedReach != null && <div>Est. reach: {c.estimatedReach} attendees</div>}
                  {c.requiredContributors != null && <div>Creators needed: {c.requiredContributors}</div>}
                </CampaignMeta>
                <ActivateButton href={`/ops?tab=campaigns-events&activate=${c.id}`}>Activate</ActivateButton>
              </CampaignCard>
            ))}
          </CampaignGrid>
        )}
      </Section>
    </div>
  );
}

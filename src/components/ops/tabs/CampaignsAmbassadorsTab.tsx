import React, { useState, useCallback } from 'react';
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

const OutreachList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const OutreachCard = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
`;

const OutreachRecipient = styled.div`
  font-weight: 700;
  color: ${({ theme }) => theme.text};
`;

const OutreachChannel = styled.span`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textMuted};
  margin-left: 0.5rem;
`;

const OutreachStatus = styled.span<{ $status: string }>`
  font-size: 0.78rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: ${({ theme, $status }) => $status === 'sent' ? theme.accentMuted ?? 'rgba(196,30,58,0.15)' : theme.backgroundAlt};
  color: ${({ theme, $status }) => $status === 'sent' ? theme.accent : theme.textMuted};
`;

const EmptyState = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

export function CampaignsAmbassadorsTab() {
  const [outreach, setOutreach] = useState<Array<{ id: string; recipient: string; channel: string; status: string; subject?: string | null; campaignId: string }>>([]);
  const [loading, setLoading] = useState(true);

  const loadOutreach = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns/outreach');
      const data = await res.json();
      setOutreach(data.outreach ?? []);
    } catch {
      setOutreach([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadOutreach(); }, [loadOutreach]);

  return (
    <div>
      <Section>
        <SectionTitle>Creator Outreach</SectionTitle>
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : outreach.length === 0 ? (
          <EmptyState>No outreach yet. When you activate campaigns and add local creators, outreach drafts will appear here for approval.</EmptyState>
        ) : (
          <OutreachList>
            {outreach.map(o => (
              <OutreachCard key={o.id}>
                <OutreachRecipient>
                  {o.recipient}
                  <OutreachChannel>({o.channel})</OutreachChannel>
                  <OutreachStatus $status={o.status}>{o.status}</OutreachStatus>
                </OutreachRecipient>
                {o.subject && <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>{o.subject}</div>}
              </OutreachCard>
            ))}
          </OutreachList>
        )}
      </Section>
    </div>
  );
}

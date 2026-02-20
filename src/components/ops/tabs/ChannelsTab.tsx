import React from 'react';
import styled from 'styled-components';
import { useChannelStats } from '@/hooks/useOpsData';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
`;

const ChannelCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
`;

const ChannelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1.25rem;
`;

const ChannelIcon = styled.span`
  font-size: 1.25rem;
`;

const ChannelName = styled.h3`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

const Stat = styled.div``;

const StatLabel = styled.p`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.2rem;
`;

const StatValue = styled.p`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0;
  font-variant-numeric: tabular-nums;
`;

const RatePill = styled.span<{ $good: boolean }>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: ${({ theme, $good }) => $good ? `${theme.success}22` : `${theme.warning}22`};
  color: ${({ theme, $good }) => $good ? theme.success : theme.warning};
`;

export function ChannelsTab() {
  const { data, loading } = useChannelStats();

  if (loading) {
    return <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Loading channel stats...</p>;
  }

  return (
    <Grid>
      <ChannelCard>
        <ChannelHeader>
          <ChannelIcon>📧</ChannelIcon>
          <ChannelName>Email Outreach</ChannelName>
        </ChannelHeader>
        <StatGrid>
          <Stat>
            <StatLabel>Total Sent</StatLabel>
            <StatValue>{data?.email.sent ?? 0}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Open Rate</StatLabel>
            <StatValue>
              {data?.email.openRate ?? 0}%
              <RatePill $good={(data?.email.openRate ?? 0) >= 20} style={{ marginLeft: 8 }}>
                {(data?.email.openRate ?? 0) >= 20 ? 'Good' : 'Low'}
              </RatePill>
            </StatValue>
          </Stat>
          <Stat>
            <StatLabel>Replies</StatLabel>
            <StatValue>{data?.email.replied ?? 0}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Reply Rate</StatLabel>
            <StatValue>{data?.email.replyRate ?? 0}%</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Bounced</StatLabel>
            <StatValue>{data?.email.bounced ?? 0}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Opened</StatLabel>
            <StatValue>{data?.email.opened ?? 0}</StatValue>
          </Stat>
        </StatGrid>
      </ChannelCard>

      <ChannelCard>
        <ChannelHeader>
          <ChannelIcon>🌐</ChannelIcon>
          <ChannelName>Site Generation</ChannelName>
        </ChannelHeader>
        <StatGrid>
          <Stat>
            <StatLabel>Total Sites</StatLabel>
            <StatValue>{data?.sites.total ?? 0}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Published</StatLabel>
            <StatValue>{data?.sites.published ?? 0}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Generating</StatLabel>
            <StatValue>{data?.sites.generating ?? 0}</StatValue>
          </Stat>
        </StatGrid>
      </ChannelCard>

      <ChannelCard>
        <ChannelHeader>
          <ChannelIcon>💬</ChannelIcon>
          <ChannelName>Chatbot</ChannelName>
        </ChannelHeader>
        <StatGrid>
          <Stat>
            <StatLabel>Conversations</StatLabel>
            <StatValue>{data?.chatbot.conversations ?? 0}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Leads</StatLabel>
            <StatValue>{data?.chatbot.leads ?? 0}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Conversion</StatLabel>
            <StatValue>{data?.chatbot.conversionRate ?? 0}%</StatValue>
          </Stat>
        </StatGrid>
        <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.875rem', marginBottom: 0 }}>
          Chatbot integration coming soon.
        </p>
      </ChannelCard>
    </Grid>
  );
}

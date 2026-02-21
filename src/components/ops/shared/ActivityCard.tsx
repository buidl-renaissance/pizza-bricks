import React from 'react';
import styled from 'styled-components';
import type { ActivityEvent } from '@/db/ops';

const ICONS: Record<string, string> = {
  email_sent: '📧',
  email_opened: '👁',
  email_replied: '↩️',
  email_bounced: '⚠️',
  site_generated: '🌐',
  site_published: '🚀',
  site_viewed: '👀',
  prospect_discovered: '🔍',
  prospect_batch_scraped: '🔍',
  onboarding_started: '🎯',
  wallet_setup: '💼',
  onboarding_completed: '✅',
  follow_up_triggered: '🔔',
  marketing_materials_requested: '📋',
  event_influencer_requested: '🎪',
  reply_intent_parsed: '🧠',
  manual_action: '🖐',
  agent_error: '❌',
};

const STATUS_COLORS = {
  completed: 'success',
  active: 'accent',
  pending: 'warning',
  failed: 'danger',
} as const;

const Card = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
`;

const Icon = styled.span`
  font-size: 1rem;
  line-height: 1.5;
  flex-shrink: 0;
`;

const Body = styled.div`
  flex: 1;
  min-width: 0;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
`;

const Target = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

function getStatusColor(theme: import('styled-components').DefaultTheme, status: string): string {
  const key = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? 'accent';
  if (key === 'success') return theme.success;
  if (key === 'danger') return theme.danger;
  if (key === 'warning') return theme.warning;
  return theme.accent;
}

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: ${({ theme, $status }) => `${getStatusColor(theme, $status)}22`};
  color: ${({ theme, $status }) => getStatusColor(theme, $status)};
`;

const Detail = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Timestamp = styled.span`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.textMuted};
  white-space: nowrap;
  flex-shrink: 0;
`;

function formatTime(d: Date | string | null): string {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(typeof d === 'number' ? d * 1000 : d);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface ActivityCardProps {
  event: ActivityEvent;
}

export function ActivityCard({ event }: ActivityCardProps) {
  const icon = ICONS[event.type] ?? '•';
  return (
    <Card>
      <Icon>{icon}</Icon>
      <Body>
        <TopRow>
          <Target>{event.targetLabel ?? event.type.replace(/_/g, ' ')}</Target>
          <StatusBadge $status={event.status}>{event.status}</StatusBadge>
        </TopRow>
        {event.detail && <Detail>{event.detail}</Detail>}
      </Body>
      <Timestamp>{formatTime(event.createdAt)}</Timestamp>
    </Card>
  );
}

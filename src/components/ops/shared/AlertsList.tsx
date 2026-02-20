import React from 'react';
import styled from 'styled-components';
import type { Alert } from '@/lib/agent/workflows/alerts';

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Item = styled.div<{ $severity: string }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  border: 1px solid ${({ theme, $severity }) =>
    $severity === 'error' ? `${theme.danger}44` :
    $severity === 'warning' ? `${theme.warning}44` :
    theme.border};
  background: ${({ theme, $severity }) =>
    $severity === 'error' ? `${theme.danger}11` :
    $severity === 'warning' ? `${theme.warning}11` :
    theme.surface};
`;

const SeverityDot = styled.span<{ $severity: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 3px;
  flex-shrink: 0;
  background: ${({ theme, $severity }) =>
    $severity === 'error' ? theme.danger :
    $severity === 'warning' ? theme.warning :
    theme.accent};
`;

const Body = styled.div``;

const Title = styled.p`
  margin: 0 0 0.2rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const Detail = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textMuted};
`;

const Empty = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
  padding: 0.75rem 0;
`;

interface AlertsListProps {
  alerts: Alert[];
}

export function AlertsList({ alerts }: AlertsListProps) {
  if (alerts.length === 0) {
    return <Empty>No active alerts — everything looks good.</Empty>;
  }
  return (
    <List>
      {alerts.map(a => (
        <Item key={a.id} $severity={a.severity}>
          <SeverityDot $severity={a.severity} />
          <Body>
            <Title>{a.title}</Title>
            <Detail>{a.detail}</Detail>
          </Body>
        </Item>
      ))}
    </List>
  );
}

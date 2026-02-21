import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const Label = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ValueRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
`;

const Value = styled.span`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  font-variant-numeric: tabular-nums;
  line-height: 1;
`;

const Badge = styled.span<{ $positive?: boolean }>`
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: ${({ theme, $positive }) =>
    $positive ? `${theme.success}22` : `${theme.danger}22`};
  color: ${({ theme, $positive }) => $positive ? theme.success : theme.danger};
`;

const Sub = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
`;

interface MetricCardProps {
  label: string;
  value: number | string;
  change?: number;
  sub?: string;
}

export function MetricCard({ label, value, change, sub }: MetricCardProps) {
  return (
    <Card>
      <Label>{label}</Label>
      <ValueRow>
        <Value>{value}</Value>
        {change !== undefined && (
          <Badge $positive={change >= 0}>
            {change >= 0 ? '+' : ''}{change}%
          </Badge>
        )}
      </ValueRow>
      {sub && <Sub>{sub}</Sub>}
    </Card>
  );
}

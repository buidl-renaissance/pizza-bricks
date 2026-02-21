import React from 'react';
import styled, { keyframes, css } from 'styled-components';

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Dot = styled.span<{ $status: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ theme, $status }) =>
    $status === 'running' ? theme.success :
    $status === 'error' ? theme.danger :
    theme.textMuted};
  ${({ $status }) => $status === 'running' && css`
    animation: ${pulse} 1.5s ease-in-out infinite;
  `}
`;

const Label = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-transform: capitalize;
`;

const ToggleButton = styled.button<{ $running: boolean }>`
  margin-left: 0.5rem;
  padding: 0.35rem 0.9rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${({ theme, $running }) => $running ? theme.danger : theme.success};
  background: transparent;
  color: ${({ theme, $running }) => $running ? theme.danger : theme.success};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme, $running }) => $running ? `${theme.danger}22` : `${theme.success}22`};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface AgentStatusBadgeProps {
  status: string;
  onPause?: () => void;
  onResume?: () => void;
  loading?: boolean;
}

export function AgentStatusBadge({ status, onPause, onResume, loading }: AgentStatusBadgeProps) {
  const isRunning = status === 'running';
  return (
    <Wrapper>
      <Dot $status={status} />
      <Label>{status}</Label>
      {(onPause || onResume) && (
        <ToggleButton
          $running={isRunning}
          disabled={loading}
          onClick={isRunning ? onPause : onResume}
        >
          {isRunning ? 'Pause' : 'Resume'}
        </ToggleButton>
      )}
    </Wrapper>
  );
}

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

type IdentityState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'registered'; agentId: string; basescanUrl: string; agentURI: string }
  | { status: 'error'; message: string };

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
`;

const CardLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.75rem;
`;

const IdentityCard = styled(Card)`
  border-left: 3px solid #6366f1;
  max-width: 560px;
`;

const IdentityHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const IdentityBadge = styled.span<{ $registered?: boolean }>`
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 3px 10px;
  border-radius: 20px;
  background: ${({ $registered }) => ($registered ? '#d1fae5' : '#e0e7ff')};
  color: ${({ $registered }) => ($registered ? '#065f46' : '#3730a3')};
`;

const IdentityDesc = styled.p`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 14px;
  line-height: 1.55;
`;

const IdentityAgentId = styled.div`
  font-size: 0.8rem;
  font-family: monospace;
  background: ${({ theme }) => theme.surface ?? '#f3f4f6'};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  padding: 6px 10px;
  margin-bottom: 12px;
  color: ${({ theme }) => theme.text};
  word-break: break-all;
`;

const IdentityActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

const RegisterBtn = styled.button<{ $loading?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  cursor: ${({ $loading }) => ($loading ? 'not-allowed' : 'pointer')};
  background: #6366f1;
  color: #fff;
  opacity: ${({ $loading }) => ($loading ? 0.7 : 1)};
  transition: background 0.15s, opacity 0.15s;
  &:hover:not(:disabled) {
    background: #4f46e5;
  }
`;

const IdentityLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  text-decoration: none;
  padding: 7px 14px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  transition: color 0.15s, border-color 0.15s;
  &:hover {
    color: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.textSecondary};
  }
`;

const IdentityError = styled.div`
  font-size: 0.8rem;
  color: #e53e3e;
  margin-top: 8px;
`;

export function SettingsRegisterAgentTab() {
  const [state, setState] = useState<IdentityState>({ status: 'idle' });

  const register = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/agent/register-identity', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? 'Registration failed' });
        return;
      }
      if (data.alreadyRegistered) {
        setState({
          status: 'registered',
          agentId: data.agentId,
          basescanUrl: data.basescanUrl,
          agentURI: data.agentURI,
        });
        return;
      }
      setState({
        status: 'registered',
        agentId: data.agentId,
        basescanUrl: data.basescanUrl,
        agentURI: data.agentURI,
      });
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      });
    }
  }, []);

  const isRegistered = state.status === 'registered';
  const isLoading = state.status === 'loading';

  return (
    <IdentityCard>
      <IdentityHeader>
        <CardLabel style={{ margin: 0 }}>ERC-8004 Agent Identity</CardLabel>
        <IdentityBadge $registered={isRegistered}>
          {isRegistered ? 'Registered' : 'Base Mainnet'}
        </IdentityBadge>
      </IdentityHeader>

      <IdentityDesc>
        Register this agent in the ERC-8004 Trustless Agents Identity Registry on Base mainnet.
        Once registered, the agent receives a unique on-chain ID tied to{' '}
        <code style={{ fontSize: '0.78rem' }}>/agent.json</code> — making its identity verifiable
        by other agents and protocols.
      </IdentityDesc>

      {isRegistered && (
        <IdentityAgentId>
          Agent ID: #{state.agentId}
          {'  ·  '}
          <span style={{ color: '#6366f1', wordBreak: 'break-all' }}>{state.agentURI}</span>
        </IdentityAgentId>
      )}

      <IdentityActions>
        {!isRegistered && (
          <RegisterBtn $loading={isLoading} onClick={register} disabled={isLoading}>
            {isLoading ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  <path
                    d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"
                    strokeDasharray="28"
                    strokeDashoffset="10"
                  />
                </svg>
                Registering…
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4l3 3" />
                </svg>
                Register Agent
              </>
            )}
          </RegisterBtn>
        )}
        <IdentityLink
          href={`${typeof window !== 'undefined' ? window.location.origin : ''}/agent.json`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          agent.json
        </IdentityLink>
        {isRegistered && (
          <IdentityLink href={state.basescanUrl} target="_blank" rel="noopener noreferrer">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Basescan
          </IdentityLink>
        )}
      </IdentityActions>

      {state.status === 'error' && <IdentityError>{state.message}</IdentityError>}
    </IdentityCard>
  );
}

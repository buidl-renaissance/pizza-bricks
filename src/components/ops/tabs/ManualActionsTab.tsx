import React, { useState } from 'react';
import styled from 'styled-components';
import { ActionModal, type ActionDef } from '../shared/ActionModal';
import { ActivityCard } from '../shared/ActivityCard';
import { useActionHistory } from '@/hooks/useOpsData';

const ACTIONS: ActionDef[] = [
  {
    action: 'discover_prospects',
    label: 'Discover Prospects',
    description: 'Run the discovery workflow to find 1–3 new food vendor prospects in the Detroit metro area.',
  },
  {
    action: 'send_outreach',
    label: 'Send Outreach Email',
    description: 'Send cold outreach emails to all newly-discovered prospects that have email addresses. Or send to a specific prospect.',
    requiresProspectId: false,
  },
  {
    action: 'run_followups',
    label: 'Run Follow-ups',
    description: 'Trigger the follow-up sequence for all prospects whose last email is overdue for a next step.',
  },
  {
    action: 'generate_site',
    label: 'Generate Site',
    description: 'Generate and deploy a website for a specific prospect via the site pipeline.',
    requiresProspectId: true,
  },
  {
    action: 'run_full_tick',
    label: 'Run Full Agent Tick',
    description: 'Run all agent workflows (discovery → outreach → follow-ups) in sequence, as if the cron fired.',
  },
];

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ActionCard = styled.button`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
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
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
`;

const ActionDesc = styled.span`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textMuted};
  line-height: 1.45;
`;

const RunBtn = styled.span`
  margin-top: auto;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
`;

const SectionTitle = styled.h2`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 0.875rem;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export function ManualActionsTab() {
  const [active, setActive] = useState<ActionDef | null>(null);
  const { events, reload } = useActionHistory();

  return (
    <div>
      <SectionTitle>Quick Actions</SectionTitle>
      <Grid>
        {ACTIONS.map(a => (
          <ActionCard key={a.action} onClick={() => setActive(a)}>
            <ActionLabel>{a.label}</ActionLabel>
            <ActionDesc>{a.description}</ActionDesc>
            <RunBtn>Run &rarr;</RunBtn>
          </ActionCard>
        ))}
      </Grid>

      <SectionTitle>Action History</SectionTitle>
      <HistoryList>
        {events.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: 0 }}>No manual actions yet.</p>
        ) : (
          events.map(e => <ActivityCard key={e.id} event={e} />)
        )}
      </HistoryList>

      {active && (
        <ActionModal
          actionDef={active}
          onClose={() => setActive(null)}
          onSuccess={() => { reload(); setActive(null); }}
        />
      )}
    </div>
  );
}

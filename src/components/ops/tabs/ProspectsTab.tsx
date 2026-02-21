import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useProspects, useSites } from '@/hooks/useOpsData';
import type { PipelineStage } from '@/db/schema';
import type { Prospect } from '@/db/ops';
import type { EnrichedSite } from '@/hooks/useOpsData';

const STAGE_COLORS: Record<PipelineStage, string> = {
  discovered: '#7B5CFF',
  contacted: '#3B82F6',
  engaged: '#06B6D4',
  onboarding: '#F59E0B',
  converted: '#22C55E',
  churned: '#6B7280',
};

// ── Layout ────────────────────────────────────────────────────────────────────

const Section = styled.section`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 0.875rem;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.surface};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.6rem 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.text};
  vertical-align: middle;

  &:last-child {
    border-bottom: none;
  }
`;

const Tr = styled.tr`
  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
  }
`;

const TypeBadge = styled.span`
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.textMuted};
  text-transform: capitalize;
`;

const StageBadge = styled.span<{ $color: string }>`
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: ${({ $color }) => `${$color}18`};
  color: ${({ $color }) => $color};
  text-transform: capitalize;
`;

const SiteLink = styled.a`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const EmailsBtn = styled.button`
  padding: 0.25rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
  }
`;

const EmptyState = styled.p`
  padding: 1.5rem;
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
`;

// ── Email modal ───────────────────────────────────────────────────────────────

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  padding: 1.25rem;
  min-width: 420px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-shrink: 0;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const CloseButton = styled.button`
  padding: 0.25rem 0.5rem;
  font-size: 1.25rem;
  line-height: 1;
  color: ${({ theme }) => theme.textMuted};
  background: transparent;
  border: none;
  cursor: pointer;
  &:hover { color: ${({ theme }) => theme.text}; }
`;

const ModalBody = styled.div`
  overflow-y: auto;
  flex: 1;
`;

const EmailList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const EmailItem = styled.li`
  padding: 0.6rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 0.8rem;

  &:last-child {
    border-bottom: none;
  }
`;

const EmailSubject = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.2rem;
`;

const EmailMeta = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const EmailStatusBadge = styled.span<{ $status: string }>`
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  margin-left: 0.5rem;
  text-transform: capitalize;
  background: ${({ theme, $status }) =>
    $status === 'replied' ? theme.success + '22' :
    $status === 'opened' ? theme.accent + '22' :
    $status === 'bounced' || $status === 'failed' ? theme.danger + '22' :
    theme.backgroundAlt};
  color: ${({ theme, $status }) =>
    $status === 'replied' ? theme.success :
    $status === 'opened' ? theme.accent :
    $status === 'bounced' || $status === 'failed' ? theme.danger :
    theme.textMuted};
`;

const ModalLoading = styled.div`
  padding: 1rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
`;

// ── Types for email log (from API) ─────────────────────────────────────────────

interface EmailLogEntry {
  id: string;
  prospectId: string;
  templateId: string;
  sequenceStep: number;
  subject: string;
  status: string;
  sentAt: number | string | null;
  openedAt: number | string | null;
  repliedAt: number | string | null;
  bounceReason: string | null;
  messageId: string | null;
}

function formatDate(ts: number | string | null): string {
  if (ts == null) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { dateStyle: 'short' }) + ' ' + d.toLocaleTimeString(undefined, { timeStyle: 'short' });
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

export function ProspectsTab() {
  const { prospects, loading } = useProspects({ limit: 200 });
  const { sites } = useSites();
  const [emailModal, setEmailModal] = useState<{ prospectId: string; prospectName: string } | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);

  const siteByProspect = React.useMemo(() => {
    const map = new Map<string, EnrichedSite>();
    for (const s of sites) {
      const existing = map.get(s.prospectId);
      if (!existing || new Date(s.generatedAt) > new Date(existing.generatedAt)) {
        map.set(s.prospectId, s);
      }
    }
    return map;
  }, [sites]);

  const openEmailModal = useCallback((prospectId: string, prospectName: string) => {
    setEmailModal({ prospectId, prospectName });
    setEmailLogs([]);
    setEmailLogsLoading(true);
  }, []);

  const closeEmailModal = useCallback(() => {
    setEmailModal(null);
    setEmailLogs([]);
  }, []);

  useEffect(() => {
    if (!emailModal) return;
    let cancelled = false;
    (async () => {
      setEmailLogsLoading(true);
      try {
        const res = await fetch(`/api/ops/prospects/${emailModal.prospectId}/emails`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setEmailLogs(data.logs ?? []);
      } finally {
        if (!cancelled) setEmailLogsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [emailModal?.prospectId]);

  return (
    <div>
      <Section>
        <SectionTitle>All prospects</SectionTitle>
        <TableWrap>
          {loading ? (
            <EmptyState>Loading…</EmptyState>
          ) : prospects.length === 0 ? (
            <EmptyState>No prospects yet.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th>City</Th>
                  <Th>Email</Th>
                  <Th>Pipeline</Th>
                  <Th>Site</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p: Prospect) => {
                  const site = siteByProspect.get(p.id);
                  return (
                    <Tr key={p.id}>
                      <Td>
                        <strong>{p.name}</strong>
                      </Td>
                      <Td><TypeBadge>{p.type}</TypeBadge></Td>
                      <Td>{p.city ?? '—'}</Td>
                      <Td>{p.email ?? '—'}</Td>
                      <Td>
                        <StageBadge $color={STAGE_COLORS[p.pipelineStage]}>{p.pipelineStage}</StageBadge>
                      </Td>
                      <Td>
                        {site?.url ? (
                          <SiteLink href={site.url} target="_blank" rel="noopener noreferrer">
                            View site ↗
                          </SiteLink>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td>
                        <EmailsBtn type="button" onClick={() => openEmailModal(p.id, p.name)}>
                          View emails
                        </EmailsBtn>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </TableWrap>
      </Section>

      {emailModal && (
        <ModalOverlay onClick={closeEmailModal}>
          <ModalContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Email correspondence — {emailModal.prospectName}</ModalTitle>
              <CloseButton type="button" onClick={closeEmailModal} aria-label="Close">
                &times;
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              {emailLogsLoading ? (
                <ModalLoading>Loading…</ModalLoading>
              ) : emailLogs.length === 0 ? (
                <ModalLoading>No emails for this prospect.</ModalLoading>
              ) : (
                <EmailList>
                  {emailLogs.map((log) => (
                    <EmailItem key={log.id}>
                      <EmailSubject>{log.subject}</EmailSubject>
                      <EmailMeta>
                        {formatDate(log.sentAt)}
                        <EmailStatusBadge $status={log.status}>{log.status}</EmailStatusBadge>
                      </EmailMeta>
                    </EmailItem>
                  ))}
                </EmailList>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
}

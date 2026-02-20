import React, { useState } from 'react';
import styled from 'styled-components';
import type { ManualActionType } from '@/pages/api/ops/actions/trigger';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.overlay};
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.75rem;
  width: 100%;
  max-width: 420px;
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const Description = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0 0 1.25rem;
  line-height: 1.5;
`;

const Label = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.375rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.6rem 0.875rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  color: ${({ theme }) => theme.text};
  font-size: 0.875rem;
  margin-bottom: 1rem;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
  &::placeholder { color: ${({ theme }) => theme.textMuted}; }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.25rem;
`;

const CancelBtn = styled.button`
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover { border-color: ${({ theme }) => theme.textMuted}; color: ${({ theme }) => theme.text}; }
`;

const ExecBtn = styled.button<{ $loading?: boolean }>`
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  background: ${({ theme, $loading }) => $loading ? theme.accentMuted : theme.accent};
  border: none;
  color: ${({ theme }) => theme.background};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: ${({ $loading }) => $loading ? 'not-allowed' : 'pointer'};
  transition: all 0.15s ease;
  &:hover:not(:disabled) { background: ${({ theme }) => theme.accentHover}; }
  &:disabled { opacity: 0.6; }
`;

const ResultBox = styled.div<{ $error?: boolean }>`
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.8rem;
  background: ${({ theme, $error }) => $error ? `${theme.danger}11` : `${theme.success}11`};
  border: 1px solid ${({ theme, $error }) => $error ? `${theme.danger}44` : `${theme.success}44`};
  color: ${({ theme, $error }) => $error ? theme.danger : theme.success};
  white-space: pre-wrap;
`;

export interface ActionDef {
  action: ManualActionType;
  label: string;
  description: string;
  requiresProspectId?: boolean;
  requiresTemplateId?: boolean;
}

interface ActionModalProps {
  actionDef: ActionDef;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ActionModal({ actionDef, onClose, onSuccess }: ActionModalProps) {
  const [prospectId, setProspectId] = useState('');
  const [templateId, setTemplateId] = useState('cold_outreach_1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const body: Record<string, string> = { action: actionDef.action };
      if (actionDef.requiresProspectId) body.prospectId = prospectId;
      if (actionDef.requiresTemplateId) body.templateId = templateId;

      const res = await fetch('/api/ops/actions/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { success?: boolean; result?: unknown; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Action failed');
      } else {
        setResult(JSON.stringify(data.result, null, 2));
        onSuccess?.();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Modal>
        <Title>{actionDef.label}</Title>
        <Description>{actionDef.description}</Description>

        {actionDef.requiresProspectId && (
          <>
            <Label>Prospect ID</Label>
            <Input
              value={prospectId}
              onChange={e => setProspectId(e.target.value)}
              placeholder="e.g. uuid-of-prospect"
            />
          </>
        )}
        {actionDef.requiresTemplateId && (
          <>
            <Label>Template ID</Label>
            <Input
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              placeholder="cold_outreach_1"
            />
          </>
        )}

        {result && <ResultBox>{result}</ResultBox>}
        {error && <ResultBox $error>{error}</ResultBox>}

        <ButtonRow>
          <CancelBtn onClick={onClose}>Cancel</CancelBtn>
          <ExecBtn $loading={loading} disabled={loading} onClick={handleExecute}>
            {loading ? 'Running...' : 'Execute'}
          </ExecBtn>
        </ButtonRow>
      </Modal>
    </Overlay>
  );
}

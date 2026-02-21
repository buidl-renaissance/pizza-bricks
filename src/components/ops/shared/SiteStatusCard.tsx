import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import styled, { keyframes, css } from 'styled-components';
import type { EnrichedSite } from '@/hooks/useOpsData';
import type { GeneratedSiteStatus } from '@/db/schema';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const STATUS_CONFIG: Record<GeneratedSiteStatus, { label: string; color: 'success' | 'accent' | 'warning' | 'danger' | 'textMuted'; pulse?: boolean }> = {
  generating:         { label: 'Generating…', color: 'accent',    pulse: true },
  pending_review:     { label: 'Pending Review', color: 'warning' },
  published:          { label: 'Published', color: 'success' },
  revision_requested: { label: 'Revision Needed', color: 'danger' },
  archived:           { label: 'Archived', color: 'textMuted' },
};

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  padding: 1.125rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
`;

const ProspectName = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
`;

type ThemeColorKey = 'success' | 'accent' | 'warning' | 'danger' | 'textMuted';

function getThemeColor(theme: import('styled-components').DefaultTheme, key: ThemeColorKey): string {
  if (key === 'success') return theme.success;
  if (key === 'accent') return theme.accent;
  if (key === 'warning') return theme.warning;
  if (key === 'danger') return theme.danger;
  return theme.textMuted;
}

const StatusBadge = styled.span<{ $color: ThemeColorKey; $pulse?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  background: ${({ theme, $color }) => `${getThemeColor(theme, $color)}22`};
  color: ${({ theme, $color }) => getThemeColor(theme, $color)};
`;

const Spinner = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const MetaRow = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const Meta = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const MetaValue = styled.span`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`;

const ProgressBar = styled.div`
  height: 3px;
  background: ${({ theme }) => theme.border};
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $indeterminate?: boolean }>`
  height: 100%;
  background: ${({ theme }) => theme.accent};
  border-radius: 2px;
  ${({ $indeterminate }) => $indeterminate && css`
    width: 40%;
    animation: ${keyframes`
      0% { transform: translateX(-100%); }
      100% { transform: translateX(300%); }
    `} 1.4s ease-in-out infinite;
  `}
  ${({ $indeterminate }) => !$indeterminate && css`width: 100%;`}
`;

const ViewLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.background};
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s ease;
  align-self: flex-start;

  &:hover { background: ${({ theme }) => theme.accentHover}; }
`;

const SecondaryLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.accent};
  border-radius: 6px;
  text-decoration: none;
  align-self: flex-start;
  &:hover { opacity: 0.9; }
`;

const RedeployButton = styled.button<{ $loading?: boolean }>`
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.accent};
  border-radius: 6px;
  cursor: ${({ $loading }) => ($loading ? 'wait' : 'pointer')};
  align-self: flex-start;
  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.6; }
`;

const BuildErrorBox = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.danger};
  background: ${({ theme }) => `${theme.danger}14`};
  border: 1px solid ${({ theme }) => theme.danger};
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 6rem;
  overflow-y: auto;
`;

const DeploymentStatusBadge = styled.span<{ $state: string }>`
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  margin-left: 0.35rem;
  background: ${({ theme, $state }) =>
    $state === 'READY' ? `${getThemeColor(theme, 'success')}22` :
    $state === 'ERROR' || $state === 'CANCELED' ? `${getThemeColor(theme, 'danger')}22` :
    `${getThemeColor(theme, 'accent')}22`};
  color: ${({ theme, $state }) =>
    $state === 'READY' ? getThemeColor(theme, 'success') :
    $state === 'ERROR' || $state === 'CANCELED' ? getThemeColor(theme, 'danger') :
    getThemeColor(theme, 'accent')};
`;

const UrlText = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  word-break: break-all;
  font-family: 'SF Mono', 'Fira Code', monospace;
`;

function formatAge(d: Date | string | null): string {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(typeof d === 'number' ? (d as number) * 1000 : d);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

interface SiteMetadata {
  deploymentId?: string;
  deploymentStatus?: string;
  buildErrorSummary?: string;
}

function parseMetadata(metadata: string | null): SiteMetadata {
  if (!metadata) return {};
  try {
    return (JSON.parse(metadata) as SiteMetadata) ?? {};
  } catch {
    return {};
  }
}

interface SiteStatusCardProps {
  site: EnrichedSite;
  onRedeploy?: () => void;
}

export function SiteStatusCard({ site, onRedeploy }: SiteStatusCardProps) {
  const config = STATUS_CONFIG[site.status] ?? STATUS_CONFIG.pending_review;
  const isGenerating = site.status === 'generating';
  const meta = parseMetadata(site.metadata);
  const deploymentStatus = meta.deploymentStatus;
  const deploymentId = meta.deploymentId;
  const buildErrorSummary = meta.buildErrorSummary;
  const showRedeploy =
    site.status === 'revision_requested' || deploymentStatus === 'ERROR' || deploymentStatus === 'CANCELED';

  const [redeployLoading, setRedeployLoading] = useState(false);
  const handleRedeploy = useCallback(async () => {
    setRedeployLoading(true);
    try {
      const res = await fetch(`/api/ops/sites/${site.id}/redeploy`, { method: 'POST' });
      if (res.ok) {
        onRedeploy?.();
      }
    } finally {
      setRedeployLoading(false);
    }
  }, [site.id, onRedeploy]);

  return (
    <Card>
      <TopRow>
        <ProspectName>{site.prospectName}</ProspectName>
        <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
          <StatusBadge $color={config.color} $pulse={config.pulse}>
            {isGenerating && <Spinner />}
            {config.label}
          </StatusBadge>
          {deploymentStatus && (
            <DeploymentStatusBadge $state={deploymentStatus}>
              {deploymentStatus}
            </DeploymentStatusBadge>
          )}
        </span>
      </TopRow>

      {isGenerating && (
        <ProgressBar>
          <ProgressFill $indeterminate />
        </ProgressBar>
      )}

      <MetaRow>
        <Meta>Started: <MetaValue>{formatAge(site.generatedAt)}</MetaValue></Meta>
        {site.templateType && <Meta>Type: <MetaValue>{site.templateType}</MetaValue></Meta>}
        {site.publishedAt && <Meta>Published: <MetaValue>{formatAge(site.publishedAt)}</MetaValue></Meta>}
        {site.viewCount > 0 && <Meta>Views: <MetaValue>{site.viewCount}</MetaValue></Meta>}
      </MetaRow>

      {buildErrorSummary && (
        <>
          <BuildErrorBox>{buildErrorSummary}</BuildErrorBox>
          {deploymentId && (
            <SecondaryLink
              href={`/api/ops/deployments/${deploymentId}/logs`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View build logs ↗
            </SecondaryLink>
          )}
        </>
      )}

      {site.url && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <UrlText>{site.url}</UrlText>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <ViewLink href={site.url} target="_blank" rel="noopener noreferrer">
              View Site ↗
            </ViewLink>
            <SecondaryLink as={Link} href={`/ops/sites/${site.id}`}>
              Edit with prompts
            </SecondaryLink>
          </div>
        </div>
      )}

      {showRedeploy && (
        <RedeployButton type="button" onClick={handleRedeploy} disabled={redeployLoading} $loading={redeployLoading}>
          {redeployLoading ? 'Redeploying…' : 'Redeploy'}
        </RedeployButton>
      )}

      {isGenerating && !site.url && (
        <Meta style={{ fontStyle: 'italic' }}>
          Deploying to Vercel… run “Sync deployment status” to update
        </Meta>
      )}
    </Card>
  );
}

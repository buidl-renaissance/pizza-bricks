import React from 'react';
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

interface SiteStatusCardProps {
  site: EnrichedSite;
}

export function SiteStatusCard({ site }: SiteStatusCardProps) {
  const config = STATUS_CONFIG[site.status] ?? STATUS_CONFIG.pending_review;
  const isGenerating = site.status === 'generating';

  return (
    <Card>
      <TopRow>
        <ProspectName>{site.prospectName}</ProspectName>
        <StatusBadge $color={config.color} $pulse={config.pulse}>
          {isGenerating && <Spinner />}
          {config.label}
        </StatusBadge>
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

      {site.url && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <UrlText>{site.url}</UrlText>
          <ViewLink href={site.url} target="_blank" rel="noopener noreferrer">
            View Site ↗
          </ViewLink>
        </div>
      )}

      {isGenerating && !site.url && (
        <Meta style={{ fontStyle: 'italic' }}>
          Deploying to Vercel… auto-refreshes every 5s
        </Meta>
      )}
    </Card>
  );
}

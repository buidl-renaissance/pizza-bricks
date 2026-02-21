import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 0.875rem;
`;

const AssetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const AssetCard = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
`;

const AssetType = styled.div`
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  text-transform: capitalize;
`;

const AssetCampaign = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.25rem;
`;

const AssetLink = styled.a`
  display: block;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.accent};
  margin-top: 0.5rem;
  word-break: break-all;
  &:hover { text-decoration: underline; }
`;

const EmptyState = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

export function CampaignsAssetsTab() {
  const [assets, setAssets] = useState<Array<{ id: string; assetType: string; url?: string | null; content?: string | null; campaignName?: string }>>([]);
  const [loading, setLoading] = useState(true);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns/assets');
      const data = await res.json();
      setAssets(data.assets ?? []);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadAssets(); }, [loadAssets]);

  return (
    <div>
      <Section>
        <SectionTitle>Event Assets</SectionTitle>
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : assets.length === 0 ? (
          <EmptyState>No assets yet. Activate campaigns to generate posters, IG drafts, RSVP page, and QR images.</EmptyState>
        ) : (
          <AssetGrid>
            {assets.map(a => (
              <AssetCard key={a.id}>
                <AssetType>{a.assetType.replace(/_/g, ' ')}</AssetType>
                {a.campaignName && <AssetCampaign>{a.campaignName}</AssetCampaign>}
                {a.url && <AssetLink href={a.url} target="_blank" rel="noopener noreferrer">{a.url}</AssetLink>}
                {a.content && !a.url && <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{a.content.slice(0, 200)}{a.content.length > 200 ? '…' : ''}</div>}
              </AssetCard>
            ))}
          </AssetGrid>
        )}
      </Section>
    </div>
  );
}

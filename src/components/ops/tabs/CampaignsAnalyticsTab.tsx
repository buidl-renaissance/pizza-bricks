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

const AnalyticGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const AnalyticCard = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
`;

const AnalyticCampaign = styled.div`
  font-weight: 700;
  color: ${({ theme }) => theme.text};
`;

const AnalyticMetrics = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.5rem;
`;

const AddButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.background};
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.accentHover}; }
`;

const EmptyState = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  padding: 1.5rem;
  min-width: 320px;
`;

const FormRow = styled.div`
  margin-bottom: 0.75rem;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.25rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  font-size: 0.9rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.5rem;
  font-size: 0.9rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`;

export function CampaignsAnalyticsTab() {
  const [analytics, setAnalytics] = useState<Array<{
    id: string;
    campaignId: string;
    campaignName?: string;
    revenue?: number | null;
    footTraffic?: number | null;
    socialReach?: number | null;
    newFollowers?: number | null;
    conversionLift?: string | null;
    recordedAt: Date | string;
  }>>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ campaignId: '', revenue: '', footTraffic: '', socialReach: '', newFollowers: '', conversionLift: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, campaignsRes] = await Promise.all([
        fetch('/api/campaigns/analytics'),
        fetch('/api/campaigns'),
      ]);
      const analyticsData = await analyticsRes.json();
      const campaignsData = await campaignsRes.json();
      setAnalytics(analyticsData.analytics ?? []);
      setCampaigns(campaignsData.campaigns ?? []);
    } catch {
      setAnalytics([]);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = useCallback(async () => {
    if (!form.campaignId) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/campaigns/analytics/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: form.campaignId,
          revenue: form.revenue ? Math.round(parseFloat(form.revenue) * 100) : undefined,
          footTraffic: form.footTraffic ? parseInt(form.footTraffic, 10) : undefined,
          socialReach: form.socialReach ? parseInt(form.socialReach, 10) : undefined,
          newFollowers: form.newFollowers ? parseInt(form.newFollowers, 10) : undefined,
          conversionLift: form.conversionLift || undefined,
        }),
      });
      if (res.ok) {
        setForm({ campaignId: '', revenue: '', footTraffic: '', socialReach: '', newFollowers: '', conversionLift: '' });
        setShowAdd(false);
        await loadData();
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, loadData]);


  return (
    <div>
      <Section>
        <SectionTitle>Post-Event Analytics</SectionTitle>
        <AddButton type="button" onClick={() => setShowAdd(true)}>Record Metrics</AddButton>
      </Section>
      <Section>
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : analytics.length === 0 ? (
          <EmptyState>No analytics yet. Record metrics after events to track revenue, foot traffic, social reach, and repeat suggestions.</EmptyState>
        ) : (
          <AnalyticGrid>
            {analytics.map(a => (
              <AnalyticCard key={a.id}>
                <AnalyticCampaign>{a.campaignName ?? a.campaignId}</AnalyticCampaign>
                <AnalyticMetrics>
                  {a.revenue != null && <div>Revenue: ${(a.revenue / 100).toFixed(2)}</div>}
                  {a.footTraffic != null && <div>Foot traffic: {a.footTraffic}</div>}
                  {a.socialReach != null && <div>Social reach: {a.socialReach}</div>}
                  {a.newFollowers != null && <div>New followers: {a.newFollowers}</div>}
                  {a.conversionLift && <div>Conversion lift: {a.conversionLift}</div>}
                </AnalyticMetrics>
              </AnalyticCard>
            ))}
          </AnalyticGrid>
        )}
      </Section>
      {showAdd && (
        <ModalOverlay onClick={() => !submitting && setShowAdd(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem' }}>Record Post-Event Metrics</h3>
            <FormRow>
              <FormLabel>Campaign</FormLabel>
              <FormSelect value={form.campaignId} onChange={e => setForm(f => ({ ...f, campaignId: e.target.value }))}>
                <option value="">Select campaign</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </FormSelect>
            </FormRow>
            <FormRow>
              <FormLabel>Revenue ($)</FormLabel>
              <FormInput type="number" step="0.01" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} placeholder="0" />
            </FormRow>
            <FormRow>
              <FormLabel>Foot Traffic</FormLabel>
              <FormInput type="number" value={form.footTraffic} onChange={e => setForm(f => ({ ...f, footTraffic: e.target.value }))} placeholder="0" />
            </FormRow>
            <FormRow>
              <FormLabel>Social Reach</FormLabel>
              <FormInput type="number" value={form.socialReach} onChange={e => setForm(f => ({ ...f, socialReach: e.target.value }))} placeholder="0" />
            </FormRow>
            <FormRow>
              <FormLabel>New Followers</FormLabel>
              <FormInput type="number" value={form.newFollowers} onChange={e => setForm(f => ({ ...f, newFollowers: e.target.value }))} placeholder="0" />
            </FormRow>
            <FormRow>
              <FormLabel>Conversion Lift (e.g. 15%)</FormLabel>
              <FormInput value={form.conversionLift} onChange={e => setForm(f => ({ ...f, conversionLift: e.target.value }))} placeholder="15%" />
            </FormRow>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <AddButton type="button" onClick={handleAdd} disabled={submitting || !form.campaignId}>
                {submitting ? 'Saving…' : 'Save'}
              </AddButton>
              <button type="button" onClick={() => !submitting && setShowAdd(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
            </div>
          </Modal>
        </ModalOverlay>
      )}
    </div>
  );
}

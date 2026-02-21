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

const ContributorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
`;

const ContributorCard = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
`;

const ContributorName = styled.div`
  font-weight: 700;
  color: ${({ theme }) => theme.text};
`;

const ContributorRole = styled.span`
  display: block;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.25rem;
`;

const ContributorEmail = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.25rem;
`;

const IntroText = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.5;
  margin: 0 0 1rem;
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

const ModalTitle = styled.h3`
  margin: 0 0 1rem;
  font-size: 1rem;
  color: ${({ theme }) => theme.text};
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

const ModalActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const SubmitButton = styled.button`
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

const CancelButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  cursor: pointer;
  &:hover { border-color: ${({ theme }) => theme.accent}; color: ${({ theme }) => theme.accent}; }
`;

const ROLES = ['photographer', 'influencer', 'ambassador', 'repeat_customer', 'referral_leader'] as const;
const ROLE_LABELS: Record<string, string> = {
  photographer: 'Photographer',
  influencer: 'Influencer',
  ambassador: 'Ambassador',
  repeat_customer: 'Repeat customer',
  referral_leader: 'Community organizer',
};

export function CampaignsContributorsTab() {
  const [contributors, setContributors] = useState<Array<{ id: string; name: string; role: string; email?: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', instagramHandle: '', role: 'influencer' as const });
  const [submitting, setSubmitting] = useState(false);

  const loadContributors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns/contributors');
      const data = await res.json();
      setContributors(data.contributors ?? []);
    } catch {
      setContributors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadContributors(); }, [loadContributors]);

  const handleAdd = useCallback(async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/campaigns/contributors/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          instagramHandle: form.instagramHandle.trim() || undefined,
          role: form.role,
        }),
      });
      if (res.ok) {
        setForm({ name: '', email: '', phone: '', instagramHandle: '', role: 'influencer' });
        setShowAdd(false);
        await loadContributors();
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, loadContributors]);

  return (
    <div>
      <Section>
        <SectionTitle>Local Creators</SectionTitle>
        <IntroText>
          Connect campaigns with local creators — photographers, influencers, community organizers — who are part of the broader local ecosystem.
        </IntroText>
        <AddButton type="button" onClick={() => setShowAdd(true)}>Add Local Creator</AddButton>
      </Section>
      <Section>
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : contributors.length === 0 ? (
          <EmptyState>No local creators yet. Add photographers, influencers, community organizers, and other local creators to connect your campaigns with the broader local ecosystem.</EmptyState>
        ) : (
          <ContributorGrid>
            {contributors.map(c => (
              <ContributorCard key={c.id}>
                <ContributorName>{c.name}</ContributorName>
                <ContributorRole>{ROLE_LABELS[c.role] ?? c.role.replace(/_/g, ' ')}</ContributorRole>
                {c.email && <ContributorEmail>{c.email}</ContributorEmail>}
              </ContributorCard>
            ))}
          </ContributorGrid>
        )}
      </Section>
      {showAdd && (
        <ModalOverlay onClick={() => !submitting && setShowAdd(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalTitle>Add Local Creator</ModalTitle>
            <FormRow>
              <FormLabel>Name *</FormLabel>
              <FormInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" />
            </FormRow>
            <FormRow>
              <FormLabel>Email</FormLabel>
              <FormInput type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" />
            </FormRow>
            <FormRow>
              <FormLabel>Phone</FormLabel>
              <FormInput value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(313) 555-0100" />
            </FormRow>
            <FormRow>
              <FormLabel>Instagram</FormLabel>
              <FormInput value={form.instagramHandle} onChange={e => setForm(f => ({ ...f, instagramHandle: e.target.value }))} placeholder="@janedoe" />
            </FormRow>
            <FormRow>
              <FormLabel>Role</FormLabel>
              <FormSelect value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as typeof form.role }))}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] ?? r.replace(/_/g, ' ')}</option>)}
              </FormSelect>
            </FormRow>
            <ModalActions>
              <SubmitButton type="button" onClick={handleAdd} disabled={submitting || !form.name.trim()}>
                {submitting ? 'Adding…' : 'Add'}
              </SubmitButton>
              <CancelButton type="button" onClick={() => !submitting && setShowAdd(false)}>Cancel</CancelButton>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </div>
  );
}

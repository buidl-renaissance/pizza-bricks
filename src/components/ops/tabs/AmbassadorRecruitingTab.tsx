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

const IntroText = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.5;
  margin: 0 0 1rem;
`;

const SignupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const SignupCard = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
`;

const SignupName = styled.div`
  font-weight: 700;
  color: ${({ theme }) => theme.text};
`;

const SignupMeta = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.25rem;
`;

const SignupRole = styled.span`
  display: inline-block;
  font-size: 0.78rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.text};
  margin-top: 0.5rem;
`;

const AddButton = styled.button`
  margin-top: 0.75rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.background};
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

const PublicLink = styled.a`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const ROLE_LABELS: Record<string, string> = {
  photographer: 'Photographer',
  influencer: 'Influencer',
  ambassador: 'Ambassador',
  repeat_customer: 'Repeat customer',
  referral_leader: 'Community organizer',
};

interface Signup {
  id: string;
  name: string;
  email: string;
  city: string | null;
  role: string;
  instagramHandle: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

export function AmbassadorRecruitingTab() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  const loadSignups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ambassador-signups');
      const data = await res.json();
      setSignups(data.signups ?? []);
    } catch {
      setSignups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSignups();
  }, [loadSignups]);

  const handleAddToCreators = useCallback(
    async (id: string) => {
      setAddingId(id);
      try {
        const res = await fetch(`/api/ambassador-signups/${id}/add-to-creators`, {
          method: 'POST',
        });
        if (res.ok) {
          await loadSignups();
        }
      } finally {
        setAddingId(null);
      }
    },
    [loadSignups]
  );

  const newSignups = signups.filter((s) => s.status === 'new');

  return (
    <div>
      <Section>
        <SectionTitle>Ambassador recruiting</SectionTitle>
        <IntroText>
          People who sign up at the public page appear here. Add them to Local Creators to include them in campaign outreach.
        </IntroText>
        <p style={{ marginBottom: '1rem' }}>
          <PublicLink href="/ambassadors" target="_blank" rel="noopener noreferrer">
            Public signup page: /ambassadors →
          </PublicLink>
        </p>
      </Section>
      <Section>
        <SectionTitle>New signups</SectionTitle>
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : newSignups.length === 0 ? (
          <EmptyState>No new signups. Share the /ambassadors link to recruit local creators.</EmptyState>
        ) : (
          <SignupGrid>
            {newSignups.map((s) => (
              <SignupCard key={s.id}>
                <SignupName>{s.name}</SignupName>
                <SignupMeta>{s.email}</SignupMeta>
                {s.city && <SignupMeta>{s.city}</SignupMeta>}
                {s.instagramHandle && <SignupMeta>@{s.instagramHandle.replace(/^@/, '')}</SignupMeta>}
                <SignupRole>{ROLE_LABELS[s.role] ?? s.role}</SignupRole>
                {s.message && (
                  <SignupMeta style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>{s.message}</SignupMeta>
                )}
                <AddButton
                  type="button"
                  onClick={() => handleAddToCreators(s.id)}
                  disabled={addingId !== null}
                >
                  {addingId === s.id ? 'Adding…' : 'Add to Local Creators'}
                </AddButton>
              </SignupCard>
            ))}
          </SignupGrid>
        )}
      </Section>
      {!loading && signups.filter((s) => s.status === 'added').length > 0 && (
        <Section>
          <SectionTitle>Recently added</SectionTitle>
          <SignupGrid>
            {signups
              .filter((s) => s.status === 'added')
              .slice(0, 10)
              .map((s) => (
                <SignupCard key={s.id}>
                  <SignupName>{s.name}</SignupName>
                  <SignupMeta>{s.email}</SignupMeta>
                  <SignupRole>{ROLE_LABELS[s.role] ?? s.role}</SignupRole>
                  <SignupMeta style={{ marginTop: '0.5rem', color: 'var(--color-success, green)' }}>
                    Added to Local Creators
                  </SignupMeta>
                </SignupCard>
              ))}
          </SignupGrid>
        </Section>
      )}
    </div>
  );
}

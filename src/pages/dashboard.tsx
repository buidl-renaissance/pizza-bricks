import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";
import type { PipelineResult } from "@/lib/site-pipeline";

// App configuration - customize these
const APP_NAME = "App Block";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ProfileImageContainer = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid ${({ theme }) => theme.accent};
  background: ${({ theme }) => theme.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const DefaultAvatar = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
`;

const UserName = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LogoutButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textMuted};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.textMuted};
    background: ${({ theme }) => theme.backgroundAlt};
  }
`;

const HeaderSpacer = styled.div`
  height: 60px;
`;

const ContentArea = styled.div`
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem 1rem;
  animation: ${fadeIn} 0.4s ease-out;
`;

const WelcomeCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 2rem;
`;

const WelcomeTitle = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const WelcomeSubtitle = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
`;

const QuickLinks = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const QuickLinkCard = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.accent};
    background: ${({ theme }) => theme.surfaceHover};
    transform: translateY(-2px);
  }
`;

const LinkTitle = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const LinkDescription = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
`;

const InfoBox = styled.div`
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px dashed ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 2rem;
`;

const InfoTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.75rem;
`;

const InfoText = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
  line-height: 1.6;

  code {
    background: ${({ theme }) => theme.surface};
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.accent};
  }
`;

// ── Generate Website section ──────────────────────────────────────────────────

const GenerateSection = styled.section`
  margin-top: 2rem;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 160px;
  padding: 0.875rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.text};
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.15s ease;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const GenerateButton = styled.button<{ $loading?: boolean }>`
  margin-top: 0.75rem;
  padding: 0.6rem 1.25rem;
  background: ${({ theme, $loading }) =>
    $loading ? theme.accentMuted : theme.accent};
  color: ${({ theme }) => theme.background};
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: ${({ $loading }) => ($loading ? 'not-allowed' : 'pointer')};
  transition: background 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ProgressText = styled.p`
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  font-style: italic;
`;

const ResultCard = styled.div`
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: ${({ theme, $status }) =>
    $status === 'READY'
      ? `${theme.success}22`
      : $status === 'ERROR'
      ? `${theme.danger}22`
      : `${theme.accent}22`};
  color: ${({ theme, $status }) =>
    $status === 'READY'
      ? theme.success
      : $status === 'ERROR'
      ? theme.danger
      : theme.accent};
`;

const ResultLink = styled.a`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorBox = styled.div`
  margin-top: 0.75rem;
  padding: 0.875rem 1rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.danger};
  border-radius: 8px;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.danger};
  line-height: 1.5;
`;

const PLACEHOLDER_TEXT = `Maria's Homemade Tamales is a Detroit-based home catering business run by Maria Gonzalez. She specializes in authentic Mexican tamales, red salsa enchiladas, and horchata. She charges $12/dozen for tamales and $15 for a full enchilada plate. Available Friday–Sunday. Call 313-555-0199 or DM @mariasdetroit on Instagram.`;

// ─────────────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  skipAuth?: boolean;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ skipAuth = false }) => {
  const router = useRouter();
  const { user, isLoading: isUserLoading, signOut } = useUser();
  const [imageError, setImageError] = useState(false);

  // Generate Website state
  const [documentText, setDocumentText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateResult, setGenerateResult] = useState<PipelineResult | null>(null);
  const [progressStage, setProgressStage] = useState('');

  // Redirect to /app if not authenticated (unless SKIP_AUTH is true)
  useEffect(() => {
    if (skipAuth) return;
    if (!isUserLoading && !user) {
      router.push('/app');
    }
  }, [skipAuth, isUserLoading, user, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const handleGenerateSite = async () => {
    if (!documentText.trim()) return;

    setIsGenerating(true);
    setGenerateError(null);
    setGenerateResult(null);
    setProgressStage('Extracting brand brief...');

    try {
      setProgressStage('Generating site (this takes 2–3 minutes)...');
      const res = await fetch('/api/generate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: documentText.trim() }),
      });

      const data = await res.json() as { success?: boolean; result?: PipelineResult; error?: string };

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Generation failed');
      }

      setGenerateResult(data.result!);
      setProgressStage('');
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Unknown error');
      setProgressStage('');
    } finally {
      setIsGenerating(false);
    }
  };

  // Loading state (when auth required, wait for user; when skipAuth, show dashboard immediately)
  if (!skipAuth && isUserLoading && !user) {
    return <Loading text="Loading..." />;
  }

  if (!skipAuth && !isUserLoading && !user) {
    return null;
  }

  if (!skipAuth && !user) {
    return null;
  }

  const displayUser = user ?? { username: 'Guest', displayName: 'Guest', pfpUrl: null };
  const displayName = displayUser.username || displayUser.displayName || 'Guest';
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // Hide sign out for Renaissance-authenticated users (they manage auth in the parent app)
  const isRenaissanceUser = !!user?.renaissanceId;

  return (
    <Container>
      <Head>
        <title>Dashboard | {APP_NAME}</title>
        <meta name="description" content={`${APP_NAME} Dashboard`} />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Main>
        <Header>
          <UserSection>
            <ProfileImageContainer>
              {displayUser.pfpUrl && !imageError ? (
                <ProfileImage
                  src={displayUser.pfpUrl}
                  alt={displayName}
                  onError={() => setImageError(true)}
                />
              ) : (
                <DefaultAvatar>{initials}</DefaultAvatar>
              )}
            </ProfileImageContainer>
            <UserName>{displayName}</UserName>
          </UserSection>
          <HeaderRight>
            {!isRenaissanceUser && user && (
              <LogoutButton onClick={handleLogout}>
                Sign Out
              </LogoutButton>
            )}
          </HeaderRight>
        </Header>

        <HeaderSpacer />

        <ContentArea>
          <WelcomeCard>
            <WelcomeTitle>Welcome, {displayName}!</WelcomeTitle>
            <WelcomeSubtitle>
              You&apos;re signed in to {APP_NAME}. This is your dashboard.
            </WelcomeSubtitle>
          </WelcomeCard>

          <InfoBox>
            <InfoTitle>🚀 Getting Started</InfoTitle>
            <InfoText>
              This is a template dashboard. Customize it by editing{' '}
              <code>src/pages/dashboard.tsx</code>. Add your app&apos;s main features,
              navigation, and content here. The authentication flow is already
              set up - users who aren&apos;t signed in will be redirected to the
              app entry page.
            </InfoText>
          </InfoBox>

          {/* ── Generate Website ───────────────────────────────────────────── */}
          <GenerateSection>
            <SectionTitle>Generate Website</SectionTitle>
            <Textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder={PLACEHOLDER_TEXT}
              disabled={isGenerating}
            />
            <GenerateButton
              onClick={handleGenerateSite}
              disabled={isGenerating || !documentText.trim()}
              $loading={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Site'}
            </GenerateButton>

            {isGenerating && progressStage && (
              <ProgressText>{progressStage}</ProgressText>
            )}

            {generateResult && (
              <ResultCard>
                <StatusBadge $status={generateResult.status}>
                  {generateResult.status}
                </StatusBadge>
                <ResultLink
                  href={generateResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {generateResult.url}
                </ResultLink>
              </ResultCard>
            )}

            {generateError && (
              <ErrorBox>{generateError}</ErrorBox>
            )}
          </GenerateSection>
        </ContentArea>
      </Main>
    </Container>
  );
};

export const getServerSideProps = async () => {
  return {
    props: {
      skipAuth: process.env.SKIP_AUTH === 'true',
    },
  };
};

export default DashboardPage;

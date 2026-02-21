import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import styled from 'styled-components';
import { getUserById } from '@/db/user';
import { SiteEditor } from '@/components/ops/SiteEditor';

const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
  padding: 1.5rem 2rem;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textMuted};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.accent};
  }
`;

const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const LoadingText = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

const ErrorText = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.danger};
  margin: 0;
`;

interface SiteData {
  site: {
    id: string;
    url: string | null;
    prospectName: string;
  };
}

export default function SiteEditorPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [site, setSite] = useState<SiteData['site'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/ops/sites/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Site not found' : 'Failed to load');
        return res.json();
      })
      .then((data: SiteData) => {
        setSite(data.site);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (!id) {
    return (
      <Container>
        <Header>
          <BackLink href="/ops?tab=channels">&larr; Channels</BackLink>
        </Header>
        <ErrorText>No site ID provided</ErrorText>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Site | Ops | Bricks</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Container>
        <Header>
          <BackLink href="/ops?tab=channels">&larr; Channels</BackLink>
          <Title>Edit Site</Title>
        </Header>

        {loading && <LoadingText>Loading...</LoadingText>}
        {error && <ErrorText>{error}</ErrorText>}
        {site && !loading && !error && (
          <SiteEditor
            siteId={site.id}
            siteUrl={site.url}
            prospectName={site.prospectName}
          />
        )}
      </Container>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (process.env.SKIP_AUTH === 'true') {
    return { props: {} };
  }

  const cookies = ctx.req.headers.cookie || '';
  const sessionMatch = cookies.match(/user_session=([^;]+)/);
  if (!sessionMatch?.[1]) {
    return { redirect: { destination: '/app', permanent: false } };
  }

  const user = await getUserById(sessionMatch[1]);
  if (!user || user.role !== 'admin') {
    return { redirect: { destination: '/app', permanent: false } };
  }

  return { props: {} };
};

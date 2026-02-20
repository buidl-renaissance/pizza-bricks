import React from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { getUserById } from '@/db/user';
import { OpsShell } from '@/components/ops/OpsShell';

interface OpsPageProps {
  skipAuth: boolean;
}

export default function OpsPage({ skipAuth }: OpsPageProps) {
  return (
    <>
      <Head>
        <title>Ops Dashboard | eThembre</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <OpsShell />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // Skip auth in dev if SKIP_AUTH=true
  if (process.env.SKIP_AUTH === 'true') {
    return { props: { skipAuth: true } };
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

  return { props: { skipAuth: false } };
};

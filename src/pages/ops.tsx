import React from 'react';
import Head from 'next/head';
import { OpsShell } from '@/components/ops/OpsShell';

export default function OpsPage() {
  return (
    <>
      <Head>
        <title>Pizza Bricks — Agent Dashboard</title>
        <meta name="description" content="Live performance dashboard for the Pizza Bricks autonomous agent." />
      </Head>
      <OpsShell />
    </>
  );
}

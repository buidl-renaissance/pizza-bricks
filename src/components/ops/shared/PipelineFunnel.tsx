import React from 'react';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import type { PipelineStageSummary } from '@/hooks/useOpsData';

// Code-split recharts to avoid hydration issues
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });

const ALL_STAGES = ['discovered', 'contacted', 'engaged', 'onboarding', 'converted', 'churned'];

const Wrapper = styled.div`
  width: 100%;
  height: 200px;
`;

interface PipelineFunnelProps {
  stages: PipelineStageSummary[];
}

export function PipelineFunnel({ stages }: PipelineFunnelProps) {
  const data = ALL_STAGES.map(stage => ({
    stage,
    count: stages.find(s => s.stage === stage)?.count ?? 0,
  }));

  return (
    <Wrapper>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
          <XAxis
            dataKey="stage"
            tick={{ fontSize: 11, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ background: '#16181C', border: '1px solid #2A2E35', borderRadius: 6, fontSize: 12 }}
            cursor={{ fill: 'rgba(123,92,255,0.08)' }}
          />
          <Bar dataKey="count" fill="#7B5CFF" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Wrapper>
  );
}

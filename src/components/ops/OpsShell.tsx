import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Lazy-load tab components
const OverviewTab = dynamic(() => import('./tabs/OverviewTab').then(m => ({ default: m.OverviewTab })), { ssr: false });
const PipelineTab = dynamic(() => import('./tabs/PipelineTab').then(m => ({ default: m.PipelineTab })), { ssr: false });
const ChannelsTab = dynamic(() => import('./tabs/ChannelsTab').then(m => ({ default: m.ChannelsTab })), { ssr: false });
const ActivityTab = dynamic(() => import('./tabs/ActivityTab').then(m => ({ default: m.ActivityTab })), { ssr: false });
const ManualActionsTab = dynamic(() => import('./tabs/ManualActionsTab').then(m => ({ default: m.ManualActionsTab })), { ssr: false });

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'pipeline', label: 'Pipeline', icon: '🔀' },
  { id: 'channels', label: 'Channels', icon: '📡' },
  { id: 'activity', label: 'Activity', icon: '📋' },
  { id: 'actions', label: 'Actions', icon: '🖐' },
] as const;

type TabId = typeof TABS[number]['id'];

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  background: ${({ theme }) => theme.background};
`;

const Sidebar = styled.nav`
  width: 200px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.surface};
  border-right: 1px solid ${({ theme }) => theme.border};
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 50;
`;

const SidebarHeader = styled.div`
  padding: 1.25rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const AppName = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.2rem;
`;

const PageTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem 0.5rem;
  flex: 1;
`;

const NavItem = styled.a<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: ${({ $active }) => $active ? '700' : '500'};
  color: ${({ theme, $active }) => $active ? theme.text : theme.textMuted};
  background: ${({ theme, $active }) => $active ? theme.backgroundAlt : 'transparent'};
  text-decoration: none;
  cursor: pointer;
  transition: all 0.12s ease;

  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
    color: ${({ theme }) => theme.text};
  }
`;

const NavIcon = styled.span`
  font-size: 1rem;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  text-decoration: none;
  border-top: 1px solid ${({ theme }) => theme.border};
  transition: color 0.12s ease;
  &:hover { color: ${({ theme }) => theme.text}; }
`;

const Content = styled.main`
  margin-left: 200px;
  flex: 1;
  padding: 2rem 2.5rem;
  max-width: 1100px;
`;

const ContentHeader = styled.div`
  margin-bottom: 1.75rem;
`;

const TabTitle = styled.h1`
  font-size: 1.4rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

export function OpsShell() {
  const router = useRouter();
  const activeTab = (router.query.tab as TabId) ?? 'overview';
  const currentTab = TABS.find(t => t.id === activeTab) ?? TABS[0];

  return (
    <Shell>
      <Sidebar>
        <SidebarHeader>
          <AppName>eThembre</AppName>
          <PageTitle>Ops Dashboard</PageTitle>
        </SidebarHeader>

        <NavList>
          {TABS.map(tab => (
            <NavItem
              key={tab.id}
              href={`/ops?tab=${tab.id}`}
              $active={activeTab === tab.id}
              onClick={(e) => {
                e.preventDefault();
                router.push(`/ops?tab=${tab.id}`, undefined, { shallow: true });
              }}
            >
              <NavIcon>{tab.icon}</NavIcon>
              {tab.label}
            </NavItem>
          ))}
        </NavList>

        <BackLink href="/dashboard">&larr; Dashboard</BackLink>
      </Sidebar>

      <Content>
        <ContentHeader>
          <TabTitle>{currentTab.label}</TabTitle>
        </ContentHeader>

        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'pipeline' && <PipelineTab />}
        {activeTab === 'channels' && <ChannelsTab />}
        {activeTab === 'activity' && <ActivityTab />}
        {activeTab === 'actions' && <ManualActionsTab />}
      </Content>
    </Shell>
  );
}

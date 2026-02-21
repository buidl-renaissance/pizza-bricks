import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const SIDEBAR_WIDTH = 200;
const SIDEBAR_NARROW_WIDTH = 56;

// Lazy-load tab components
const OverviewTab = dynamic(() => import('./tabs/OverviewTab').then(m => ({ default: m.OverviewTab })), { ssr: false });
const PipelineTab = dynamic(() => import('./tabs/PipelineTab').then(m => ({ default: m.PipelineTab })), { ssr: false });
const ChannelsTab = dynamic(() => import('./tabs/ChannelsTab').then(m => ({ default: m.ChannelsTab })), { ssr: false });
const ActivityTab = dynamic(() => import('./tabs/ActivityTab').then(m => ({ default: m.ActivityTab })), { ssr: false });
const OutreachTab = dynamic(() => import('./tabs/OutreachTab').then(m => ({ default: m.OutreachTab })), { ssr: false });
const CampaignsSuggestTab = dynamic(() => import('./tabs/CampaignsSuggestTab').then(m => ({ default: m.CampaignsSuggestTab })), { ssr: false });
const CampaignsEventsTab = dynamic(() => import('./tabs/CampaignsEventsTab').then(m => ({ default: m.CampaignsEventsTab })), { ssr: false });
const CampaignsContributorsTab = dynamic(() => import('./tabs/CampaignsContributorsTab').then(m => ({ default: m.CampaignsContributorsTab })), { ssr: false });
const CampaignsAmbassadorsTab = dynamic(() => import('./tabs/CampaignsAmbassadorsTab').then(m => ({ default: m.CampaignsAmbassadorsTab })), { ssr: false });
const CampaignsAssetsTab = dynamic(() => import('./tabs/CampaignsAssetsTab').then(m => ({ default: m.CampaignsAssetsTab })), { ssr: false });
const CampaignsAnalyticsTab = dynamic(() => import('./tabs/CampaignsAnalyticsTab').then(m => ({ default: m.CampaignsAnalyticsTab })), { ssr: false });
const AmbassadorRecruitingTab = dynamic(() => import('./tabs/AmbassadorRecruitingTab').then(m => ({ default: m.AmbassadorRecruitingTab })), { ssr: false });
const SettingsRegisterAgentTab = dynamic(() => import('./tabs/SettingsRegisterAgentTab').then(m => ({ default: m.SettingsRegisterAgentTab })), { ssr: false });

type Tab = { id: string; label: string; icon: string };
type NavGroup = { id: string; label: string; icon: string; tabs: readonly Tab[] };

const TOP_LEVEL_TABS: readonly Tab[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'pipeline', label: 'Pipeline', icon: '🔀' },
  { id: 'channels', label: 'Channels', icon: '📡' },
  { id: 'activity', label: 'Activity', icon: '📋' },
  { id: 'outreach', label: 'Outreach', icon: '📤' },
];

const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: 'campaigns',
    label: 'Campaigns',
    icon: '🎯',
    tabs: [
      { id: 'campaigns-suggest', label: 'Suggest Campaign', icon: '🎯' },
      { id: 'campaigns-events', label: 'Upcoming Events', icon: '📅' },
      { id: 'campaigns-contributors', label: 'Local Creators', icon: '👥' },
      { id: 'campaigns-recruiting', label: 'Recruiting', icon: '🎪' },
      { id: 'campaigns-ambassadors', label: 'Creator Outreach', icon: '📬' },
      { id: 'campaigns-assets', label: 'Event Assets', icon: '🖼' },
      { id: 'campaigns-analytics', label: 'Analytics', icon: '📈' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    tabs: [
      { id: 'settings-register-agent', label: 'Register Agent', icon: '🤖' },
    ],
  },
];

const ALL_TABS: Tab[] = [
  ...TOP_LEVEL_TABS,
  ...NAV_GROUPS.flatMap(g => g.tabs),
];

type TabId = (typeof ALL_TABS)[number]['id'];

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  background: ${({ theme }) => theme.background};
`;

const Sidebar = styled.nav<{ $narrow?: boolean }>`
  width: ${({ $narrow }) => ($narrow ? SIDEBAR_NARROW_WIDTH : SIDEBAR_WIDTH)}px;
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
  transition: width 0.15s ease;
`;

const SidebarHeader = styled.div<{ $narrow?: boolean }>`
  padding: ${({ $narrow }) => ($narrow ? '1rem 0' : '1.25rem 1rem')};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex;
  flex-direction: column;
  align-items: ${({ $narrow }) => ($narrow ? 'center' : 'stretch')};
`;

const AppName = styled.div<{ $narrow?: boolean }>`
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.2rem;
  ${({ $narrow }) => $narrow && 'display: none;'}
`;

const PageTitle = styled.div<{ $narrow?: boolean }>`
  font-size: ${({ $narrow }) => ($narrow ? '0.75rem' : '0.95rem')};
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  ${({ $narrow }) => $narrow && 'writing-mode: vertical-rl; transform: rotate(180deg);'}
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem 0.5rem;
  flex: 1;
`;

const NavItem = styled.a<{ $active: boolean; $narrow?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $narrow }) => ($narrow ? 'center' : 'flex-start')};
  gap: 0.625rem;
  padding: ${({ $narrow }) => ($narrow ? '0.6rem' : '0.6rem 0.75rem')};
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

const NavItemLabel = styled.span<{ $narrow?: boolean }>`
  ${({ $narrow }) => $narrow && 'display: none;'}
`;

const NavIcon = styled.span`
  font-size: 1rem;
`;

const NavGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const NavGroupHeader = styled.button<{ $expanded: boolean; $narrow?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $narrow }) => ($narrow ? 'center' : 'flex-start')};
  gap: 0.625rem;
  padding: ${({ $narrow }) => ($narrow ? '0.6rem' : '0.6rem 0.75rem')};
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 0.12s ease;

  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
    color: ${({ theme }) => theme.text};
  }
`;

const NavGroupChevron = styled.span<{ $expanded: boolean; $narrow?: boolean }>`
  margin-left: auto;
  font-size: 0.7rem;
  transition: transform 0.15s ease;
  transform: rotate(${({ $expanded }) => ($expanded ? '90deg' : '0deg')});
  ${({ $narrow }) => $narrow && 'display: none;'}
`;

const NavGroupLabel = styled.span<{ $narrow?: boolean }>`
  ${({ $narrow }) => $narrow && 'display: none;'}
`;

const PopoverAnchor = styled.div`
  position: relative;
`;

const Popover = styled.div`
  position: fixed;
  left: ${SIDEBAR_NARROW_WIDTH}px;
  min-width: 180px;
  padding: 0.5rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const PopoverItem = styled.a<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: ${({ $active }) => ($active ? '700' : '500')};
  color: ${({ theme, $active }) => ($active ? theme.text : theme.textMuted)};
  background: ${({ theme, $active }) => ($active ? theme.backgroundAlt : 'transparent')};
  text-decoration: none;
  cursor: pointer;
  transition: all 0.12s ease;

  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
    color: ${({ theme }) => theme.text};
  }
`;

const SidebarToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.5rem;
  margin: 0.25rem 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.textMuted};
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.12s ease;

  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
    color: ${({ theme }) => theme.text};
  }
`;

const NavSubList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding-left: 0.5rem;
  margin-left: 1.25rem;
  border-left: 1px solid ${({ theme }) => theme.border};
`;

const NavSubItem = styled.a<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: ${({ $active }) => ($active ? '700' : '500')};
  color: ${({ theme, $active }) => ($active ? theme.text : theme.textMuted)};
  background: ${({ theme, $active }) => ($active ? theme.backgroundAlt : 'transparent')};
  text-decoration: none;
  cursor: pointer;
  transition: all 0.12s ease;

  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
    color: ${({ theme }) => theme.text};
  }
`;

const BackLink = styled(Link)<{ $narrow?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $narrow }) => ($narrow ? 'center' : 'flex-start')};
  gap: 0.5rem;
  padding: ${({ $narrow }) => ($narrow ? '0.75rem' : '0.75rem 1rem')};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  text-decoration: none;
  border-top: 1px solid ${({ theme }) => theme.border};
  transition: color 0.12s ease;
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const BackLinkLabel = styled.span<{ $narrow?: boolean }>`
  ${({ $narrow }) => $narrow && 'display: none;'}
`;

const Content = styled.main<{ $fullWidth?: boolean; $narrow?: boolean }>`
  margin-left: ${({ $narrow }) => ($narrow ? SIDEBAR_NARROW_WIDTH : SIDEBAR_WIDTH)}px;
  flex: 1;
  padding: 2rem 2.5rem;
  max-width: ${({ $fullWidth }) => ($fullWidth ? 'none' : '1100px')};
  transition: margin-left 0.15s ease;
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

function isTabInGroup(tabId: string, group: NavGroup): boolean {
  return group.tabs.some(t => t.id === tabId);
}

export function OpsShell() {
  const router = useRouter();
  const activeTab = (router.query.tab as TabId) ?? 'overview';
  const currentTab = ALL_TABS.find(t => t.id === activeTab) ?? ALL_TABS[0];

  const [isNarrow, setIsNarrow] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const g of NAV_GROUPS) {
      if (isTabInGroup(activeTab, g)) set.add(g.id);
    }
    return set;
  });
  const [openPopoverGroupId, setOpenPopoverGroupId] = useState<string | null>(null);
  const campaignsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Redirect legacy ambassador-recruiting URL to campaigns recruiting
  useEffect(() => {
    if (router.query.tab === 'ambassador-recruiting') {
      router.replace('/ops?tab=campaigns-recruiting', undefined, { shallow: true });
    }
  }, [router.query.tab, router]);

  useEffect(() => {
    for (const g of NAV_GROUPS) {
      if (isTabInGroup(activeTab, g)) {
        setExpandedGroups(prev => (prev.has(g.id) ? prev : new Set(prev).add(g.id)));
        break;
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (openPopoverGroupId === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        campaignsButtonRef.current?.contains(target) ||
        settingsButtonRef.current?.contains(target)
      ) {
        return;
      }
      setOpenPopoverGroupId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPopoverGroupId]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const campaignsGroup = NAV_GROUPS[0];
  const settingsGroup = NAV_GROUPS[1];
  const [popoverTop, setPopoverTop] = useState(0);

  useEffect(() => {
    if (openPopoverGroupId === 'campaigns' && campaignsButtonRef.current) {
      setPopoverTop(campaignsButtonRef.current.getBoundingClientRect().bottom);
    } else if (openPopoverGroupId === 'settings' && settingsButtonRef.current) {
      setPopoverTop(settingsButtonRef.current.getBoundingClientRect().bottom);
    }
  }, [openPopoverGroupId]);

  return (
    <Shell>
      <Sidebar $narrow={isNarrow}>
        <SidebarHeader $narrow={isNarrow}>
          <AppName $narrow={isNarrow}>Bricks</AppName>
          <PageTitle $narrow={isNarrow}>Ops Dashboard</PageTitle>
        </SidebarHeader>

        <NavList>
          {TOP_LEVEL_TABS.map(tab => (
            <NavItem
              key={tab.id}
              href={`/ops?tab=${tab.id}`}
              $active={activeTab === tab.id}
              $narrow={isNarrow}
              title={isNarrow ? tab.label : undefined}
              onClick={(e) => {
                e.preventDefault();
                router.push(`/ops?tab=${tab.id}`, undefined, { shallow: true });
              }}
            >
              <NavIcon>{tab.icon}</NavIcon>
              <NavItemLabel $narrow={isNarrow}>{tab.label}</NavItemLabel>
            </NavItem>
          ))}
          {NAV_GROUPS.map(group => {
            const isExpanded = expandedGroups.has(group.id);
            const showSubItems = !isNarrow && isExpanded;
            const isCampaigns = group.id === 'campaigns';
            const isSettings = group.id === 'settings';
            const usePopoverWhenNarrow = isNarrow && (isCampaigns || isSettings);

            return (
              <NavGroup key={group.id}>
                {usePopoverWhenNarrow ? (
                  <PopoverAnchor>
                    <NavGroupHeader
                      ref={isCampaigns ? campaignsButtonRef : settingsButtonRef}
                      type="button"
                      $expanded={false}
                      $narrow={true}
                      title={group.label}
                      onClick={() =>
                        setOpenPopoverGroupId((id) => (id === group.id ? null : group.id))
                      }
                    >
                      <NavIcon>{group.icon}</NavIcon>
                      <NavGroupLabel $narrow>{group.label}</NavGroupLabel>
                    </NavGroupHeader>
                    {openPopoverGroupId === group.id && (
                      <Popover
                        ref={popoverRef}
                        style={{ top: (isCampaigns ? campaignsButtonRef : settingsButtonRef).current?.getBoundingClientRect().bottom ?? 8 }}
                      >
                        {group.tabs.map(tab => (
                          <PopoverItem
                            key={tab.id}
                            href={`/ops?tab=${tab.id}`}
                            $active={activeTab === tab.id}
                            onClick={(e) => {
                              e.preventDefault();
                              router.push(`/ops?tab=${tab.id}`, undefined, { shallow: true });
                              setOpenPopoverGroupId(null);
                            }}
                          >
                            <NavIcon>{tab.icon}</NavIcon>
                            {tab.label}
                          </PopoverItem>
                        ))}
                      </Popover>
                    )}
                  </PopoverAnchor>
                ) : (
                  <>
                    <NavGroupHeader
                      type="button"
                      $expanded={isExpanded}
                      $narrow={isNarrow}
                      title={isNarrow ? group.label : undefined}
                      onClick={() => toggleGroup(group.id)}
                    >
                      <NavIcon>{group.icon}</NavIcon>
                      <NavGroupLabel $narrow={isNarrow}>{group.label}</NavGroupLabel>
                      <NavGroupChevron $expanded={isExpanded} $narrow={isNarrow}>
                        ›
                      </NavGroupChevron>
                    </NavGroupHeader>
                    {showSubItems && (
                      <NavSubList>
                        {group.tabs.map(tab => (
                          <NavSubItem
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
                          </NavSubItem>
                        ))}
                      </NavSubList>
                    )}
                  </>
                )}
              </NavGroup>
            );
          })}
        </NavList>

        <SidebarToggle
          type="button"
          onClick={() => setIsNarrow((n) => !n)}
          title={isNarrow ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isNarrow ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isNarrow ? '›' : '‹'}
        </SidebarToggle>
        <BackLink href="/dashboard" $narrow={isNarrow} title={isNarrow ? 'Dashboard' : undefined}>
          <span>&larr;</span>
          <BackLinkLabel $narrow={isNarrow}> Dashboard</BackLinkLabel>
        </BackLink>
      </Sidebar>

      {openPopoverGroupId === 'campaigns' && campaignsGroup && (
        <Popover ref={popoverRef} style={{ top: popoverTop }}>
          {campaignsGroup.tabs.map(tab => (
            <PopoverItem
              key={tab.id}
              href={`/ops?tab=${tab.id}`}
              $active={activeTab === tab.id}
              onClick={(e) => {
                e.preventDefault();
                router.push(`/ops?tab=${tab.id}`, undefined, { shallow: true });
                setOpenPopoverGroupId(null);
              }}
            >
              <NavIcon>{tab.icon}</NavIcon>
              {tab.label}
            </PopoverItem>
          ))}
        </Popover>
      )}
      {openPopoverGroupId === 'settings' && settingsGroup && (
        <Popover ref={popoverRef} style={{ top: popoverTop }}>
          {settingsGroup.tabs.map(tab => (
            <PopoverItem
              key={tab.id}
              href={`/ops?tab=${tab.id}`}
              $active={activeTab === tab.id}
              onClick={(e) => {
                e.preventDefault();
                router.push(`/ops?tab=${tab.id}`, undefined, { shallow: true });
                setOpenPopoverGroupId(null);
              }}
            >
              <NavIcon>{tab.icon}</NavIcon>
              {tab.label}
            </PopoverItem>
          ))}
        </Popover>
      )}

      <Content
        $fullWidth={activeTab === 'pipeline' || activeTab === 'outreach' || activeTab === 'campaigns-events'}
        $narrow={isNarrow}
      >
        <ContentHeader>
          <TabTitle>{currentTab.label}</TabTitle>
        </ContentHeader>

        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'pipeline' && <PipelineTab />}
        {activeTab === 'channels' && <ChannelsTab />}
        {activeTab === 'activity' && <ActivityTab />}
        {activeTab === 'outreach' && <OutreachTab />}
        {activeTab === 'campaigns-suggest' && <CampaignsSuggestTab />}
        {activeTab === 'campaigns-events' && <CampaignsEventsTab />}
        {activeTab === 'campaigns-contributors' && <CampaignsContributorsTab />}
        {activeTab === 'campaigns-recruiting' && <AmbassadorRecruitingTab />}
        {activeTab === 'campaigns-ambassadors' && <CampaignsAmbassadorsTab />}
        {activeTab === 'campaigns-assets' && <CampaignsAssetsTab />}
        {activeTab === 'campaigns-analytics' && <CampaignsAnalyticsTab />}
        {activeTab === 'settings-register-agent' && <SettingsRegisterAgentTab />}
      </Content>
    </Shell>
  );
}

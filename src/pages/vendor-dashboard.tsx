import { useState, useRef, useEffect, useCallback, useReducer } from 'react';
import Head from 'next/head';
import styled, { keyframes } from 'styled-components';
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { FundButton } from '@coinbase/onchainkit/fund';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { base } from 'wagmi/chains';
import { useUser } from '@/contexts/UserContext';

const USDC_BASE_MAINNET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
const AGENT_WALLET = (process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS ?? '') as `0x${string}`;
const APP_NAME = 'Pizza Bricks';

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function WalletMenu({ address }: { address: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { disconnect } = useDisconnect();
  const { data: usdcBalance } = useBalance({
    address: address as `0x${string}`,
    token: USDC_BASE_MAINNET,
    chainId: base.id,
  });
  const { data: ethBalance } = useBalance({
    address: address as `0x${string}`,
    chainId: base.id,
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const copyAddress = useCallback(async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [address]);

  return (
    <MenuRoot ref={ref}>
      <TriggerButton onClick={() => setOpen(o => !o)}>
        <Jazzicon seed={address} />
        <TriggerAddress>{shortenAddress(address)}</TriggerAddress>
        <ChevronIcon $open={open}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </ChevronIcon>
      </TriggerButton>

      {open && (
        <DropdownPanel>
          {/* Identity */}
          <DropSection $noBorder>
            <IdentityRow>
              <BigJazzicon seed={address} />
              <IdentityInfo>
                <IdentityLabel>Connected wallet</IdentityLabel>
                <AddressRow>
                  <FullAddress>{shortenAddress(address)}</FullAddress>
                  <CopyBtn onClick={copyAddress} title="Copy address">
                    {copied ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </CopyBtn>
                </AddressRow>
                <NetworkPill>
                  <NetworkDot />
                  Base
                </NetworkPill>
              </IdentityInfo>
            </IdentityRow>
          </DropSection>

          {/* Balances */}
          <DropSection>
            <DropSectionTitle>Balances</DropSectionTitle>
            <BalanceItem>
              <BalanceItemIcon $color="#2775CA">$</BalanceItemIcon>
              <BalanceItemInfo>
                <BalanceItemName>USDC</BalanceItemName>
                <BalanceItemSub>USD Coin</BalanceItemSub>
              </BalanceItemInfo>
              <BalanceItemAmount>
                {usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(2) : '0.00'}
              </BalanceItemAmount>
            </BalanceItem>
            <BalanceItem>
              <BalanceItemIcon $color="#627EEA">Ξ</BalanceItemIcon>
              <BalanceItemInfo>
                <BalanceItemName>ETH</BalanceItemName>
                <BalanceItemSub>Gas token</BalanceItemSub>
              </BalanceItemInfo>
              <BalanceItemAmount>
                {ethBalance ? parseFloat(ethBalance.formatted).toFixed(5) : '0.00000'}
              </BalanceItemAmount>
            </BalanceItem>
          </DropSection>

          {/* Actions */}
          <DropSection>
            <DropSectionTitle>Actions</DropSectionTitle>
            <DropLink
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              <DropLinkIcon>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </DropLinkIcon>
              View on Basescan
            </DropLink>
            <DropLink
              href="https://wallet.coinbase.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              <DropLinkIcon>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </DropLinkIcon>
              Coinbase Wallet
            </DropLink>
          </DropSection>

          {/* Disconnect */}
          <DropSection $noBottomPad>
            <DisconnectItem onClick={() => { disconnect(); setOpen(false); }}>
              <DropLinkIcon $danger>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </DropLinkIcon>
              Disconnect
            </DisconnectItem>
          </DropSection>
        </DropdownPanel>
      )}
    </MenuRoot>
  );
}

/** Simple deterministic colored circle as a jazzicon substitute */
function Jazzicon({ seed }: { seed: string }) {
  const hue = parseInt(seed.slice(2, 8), 16) % 360;
  return <JazziconCircle style={{ background: `hsl(${hue},70%,55%)` }} />;
}
function BigJazzicon({ seed }: { seed: string }) {
  const hue = parseInt(seed.slice(2, 8), 16) % 360;
  return <BigJazziconCircle style={{ background: `hsl(${hue},70%,55%)` }} />;
}

interface AdiBalanceState {
  status: 'idle' | 'loading' | 'ok' | 'error';
  balance?: string;
  address?: string;
  error?: string;
}

function useAdiBalance() {
  const [state, setState] = useState<AdiBalanceState>({ status: 'idle' });
  // useReducer trick to trigger a re-fetch
  const [tick, refresh] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    setState(s => ({ ...s, status: 'loading' }));
    fetch('/api/tokens/adi-balance')
      .then(r => r.json())
      .then(d => {
        if (d.error) setState({ status: 'error', error: d.error });
        else setState({ status: 'ok', balance: d.balance, address: d.address });
      })
      .catch(e => setState({ status: 'error', error: e.message }));
  }, [tick]);

  return { ...state, refresh };
}

function AdiBalanceCard() {
  const { status, balance, address, error, refresh } = useAdiBalance();

  return (
    <AdiCard>
      <AdiCardHeader>
        <CardLabel style={{ margin: 0 }}>ADI Network — Deployer Balance</CardLabel>
        <RefreshBtn onClick={refresh} title="Refresh" disabled={status === 'loading'}>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            style={{ animation: status === 'loading' ? 'spin 0.8s linear infinite' : 'none' }}
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </RefreshBtn>
      </AdiCardHeader>

      {status === 'loading' || status === 'idle' ? (
        <AdiSkeleton />
      ) : status === 'error' ? (
        <AdiError>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </AdiError>
      ) : (
        <>
          <AdiBalanceRow>
            <AdiAmount>{balance}</AdiAmount>
            <AdiSymbol>ADI</AdiSymbol>
          </AdiBalanceRow>
          {address && (
            <AdiAddress title={address}>
              {address.slice(0, 10)}…{address.slice(-8)}
            </AdiAddress>
          )}
          <AdiNetwork>
            <NetworkDot />
            ADI Network Mainnet
          </AdiNetwork>
        </>
      )}
    </AdiCard>
  );
}

type IdentityState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'registered'; agentId: string; basescanUrl: string; agentURI: string }
  | { status: 'error'; message: string };

function AgentIdentityCard() {
  const [state, setState] = useState<IdentityState>({ status: 'idle' });

  const register = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/agent/register-identity', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? 'Registration failed' });
        return;
      }
      if (data.alreadyRegistered) {
        setState({
          status: 'registered',
          agentId: data.agentId,
          basescanUrl: data.basescanUrl,
          agentURI: data.agentURI,
        });
        return;
      }
      setState({
        status: 'registered',
        agentId: data.agentId,
        basescanUrl: data.basescanUrl,
        agentURI: data.agentURI,
      });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Network error' });
    }
  }, []);

  const isRegistered = state.status === 'registered';
  const isLoading = state.status === 'loading';

  return (
    <IdentityCard>
      <IdentityHeader>
        <CardLabel style={{ margin: 0 }}>ERC-8004 Agent Identity</CardLabel>
        <IdentityBadge $registered={isRegistered}>
          {isRegistered ? 'Registered' : 'Base'}
        </IdentityBadge>
      </IdentityHeader>

      <IdentityDesc>
        Register this agent in the ERC-8004 Trustless Agents Identity Registry on Base.
        Once registered, the agent receives a unique on-chain ID tied to{' '}
        <code style={{ fontSize: '0.78rem' }}>/agent.json</code> — making its identity verifiable
        by other agents and protocols.
      </IdentityDesc>

      {isRegistered && (
        <IdentityAgentId>
          Agent ID: #{state.agentId}
          {'  ·  '}
          <span style={{ color: '#6366f1', wordBreak: 'break-all' }}>{state.agentURI}</span>
        </IdentityAgentId>
      )}

      <IdentityActions>
        {!isRegistered && (
          <RegisterBtn $loading={isLoading} onClick={register} disabled={isLoading}>
            {isLoading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" strokeDasharray="28" strokeDashoffset="10" />
                </svg>
                Registering…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 3" />
                </svg>
                Register Agent
              </>
            )}
          </RegisterBtn>
        )}
        <IdentityLink
          href={`${typeof window !== 'undefined' ? window.location.origin : ''}/agent.json`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          agent.json
        </IdentityLink>
        {isRegistered && (
          <IdentityLink href={state.basescanUrl} target="_blank" rel="noopener noreferrer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Basescan
          </IdentityLink>
        )}
      </IdentityActions>

      {state.status === 'error' && (
        <IdentityError>{state.message}</IdentityError>
      )}
    </IdentityCard>
  );
}

// ── Vendor profile (onboarding data) ────────────────────────────────────────
interface VendorMe {
  fallback?: boolean;
  onboarding: {
    prospectCode: string;
    status: string;
    contactName: string | null;
    businessName: string | null;
    preferredEmail: string | null;
    phone: string | null;
  } | null;
  vendor: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    rating: string | null;
    reviewCount: number | null;
    categories: string[];
    menuItems: { name: string; description?: string; price?: string }[];
    topReviews: { text: string; rating: number; authorName: string }[];
    coverPhotoUrl: string | null;
    websiteUrl: string | null;
  } | null;
}

function VendorProfileCard({ address }: { address: string | undefined }) {
  const [data, setData] = useState<VendorMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/vendor/me?wallet=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [address]);

  if (!address) {
    return (
      <VendorProfileCardRoot>
        <CardLabel>About your business</CardLabel>
        <VendorProfilePlaceholder>
          Connect your vendor wallet to load business details.
        </VendorProfilePlaceholder>
      </VendorProfileCardRoot>
    );
  }
  if (loading) {
    return (
      <VendorProfileCardRoot>
        <CardLabel>About your business</CardLabel>
        <VendorProfilePlaceholder>Loading…</VendorProfilePlaceholder>
      </VendorProfileCardRoot>
    );
  }
  if (!data?.onboarding && !data?.vendor) {
    return (
      <VendorProfileCardRoot>
        <CardLabel>About your business</CardLabel>
        <VendorProfilePlaceholder>
          No vendor profile found for this wallet yet.
          <VendorProfileCta as="a" href="/onboard?demo=true">Get started</VendorProfileCta>
        </VendorProfilePlaceholder>
      </VendorProfileCardRoot>
    );
  }

  const onboarding = data.onboarding;
  const vendor = data.vendor;
  const isFallback = !!data.fallback;
  const businessName = onboarding?.businessName || vendor?.name || 'Your business';
  const categories = vendor?.categories ?? [];
  const topReviews = vendor?.topReviews ?? [];
  const coverPhotoUrl = vendor?.coverPhotoUrl;

  return (
    <VendorProfileCardRoot>
      <CardLabel>About your business</CardLabel>
      {coverPhotoUrl && (
        <VendorCoverPhoto src={coverPhotoUrl} alt={businessName} />
      )}
      <VendorProfileBody>
        <VendorBizName>{businessName}</VendorBizName>
        {isFallback && (
          <VendorPreviewNote>
            Preview profile only — complete full onboarding to lock this section to your wallet.
          </VendorPreviewNote>
        )}
        {onboarding?.prospectCode && (
          <VendorProspectCode>{onboarding.prospectCode}</VendorProspectCode>
        )}
        {(onboarding?.contactName || onboarding?.preferredEmail || onboarding?.phone || vendor?.address) && (
          <VendorContactBlock>
            {onboarding?.contactName && <VendorContactLine><strong>Contact:</strong> {onboarding.contactName}</VendorContactLine>}
            {onboarding?.preferredEmail && <VendorContactLine><strong>Email:</strong> {onboarding.preferredEmail}</VendorContactLine>}
            {(onboarding?.phone || vendor?.phone) && <VendorContactLine><strong>Phone:</strong> {onboarding?.phone || vendor?.phone}</VendorContactLine>}
            {vendor?.address && <VendorContactLine><strong>Address:</strong> {vendor.address}</VendorContactLine>}
          </VendorContactBlock>
        )}
        {vendor?.rating != null && (
          <VendorRating>
            {'★'.repeat(Math.round(parseFloat(vendor.rating)))}
            <span>{vendor.rating}</span>
            {vendor.reviewCount != null && <span>({vendor.reviewCount} reviews)</span>}
          </VendorRating>
        )}
        {categories.length > 0 && (
          <VendorTagRow>
            {categories.map((c) => (
              <VendorTag key={c}>{c}</VendorTag>
            ))}
          </VendorTagRow>
        )}
        {topReviews.length > 0 && (
          <VendorSection>
            <VendorSectionTitle>What customers say</VendorSectionTitle>
            {topReviews.slice(0, 3).map((r, i) => (
              <VendorReview key={i}>
                <VendorReviewStars>{'★'.repeat(r.rating)}</VendorReviewStars>
                <VendorReviewText>&ldquo;{r.text}&rdquo;</VendorReviewText>
                <VendorReviewAuthor>— {r.authorName}</VendorReviewAuthor>
              </VendorReview>
            ))}
          </VendorSection>
        )}
      </VendorProfileBody>
    </VendorProfileCardRoot>
  );
}

function VendorMenuCard({ address }: { address: string | undefined }) {
  const [data, setData] = useState<VendorMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/vendor/me?wallet=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [address]);

  const menuItems = data?.vendor?.menuItems ?? [];

  return (
    <MenuCardRoot>
      <CardLabel>Menu</CardLabel>
      {!address ? (
        <VendorEmptyState>Connect your vendor wallet to load menu items.</VendorEmptyState>
      ) : loading ? (
        <VendorProfilePlaceholder>Loading…</VendorProfilePlaceholder>
      ) : menuItems.length > 0 ? (
        <VendorMenuList>
          {menuItems.map((m) => (
            <VendorMenuItem key={m.name}>
              <span>{m.name}</span>
              {m.price != null && <VendorMenuPrice>{m.price}</VendorMenuPrice>}
            </VendorMenuItem>
          ))}
        </VendorMenuList>
      ) : (
        <VendorEmptyState>
          Menu items are not available yet. They will appear after vendor enrichment/tokenized onboarding data sync.
        </VendorEmptyState>
      )}
    </MenuCardRoot>
  );
}

export default function VendorDashboard() {
  const { address, isConnected } = useAccount();
  const { user } = useUser();
  const linkedAccountAddress = user?.accountAddress ?? null;

  const isConnectedAgentWallet =
    !!address &&
    !!AGENT_WALLET &&
    address.toLowerCase() === AGENT_WALLET.toLowerCase();
  const linkedIsVendorWallet =
    !!linkedAccountAddress &&
    (!AGENT_WALLET || linkedAccountAddress.toLowerCase() !== AGENT_WALLET.toLowerCase());
  const vendorLookupAddress =
    (isConnectedAgentWallet && linkedIsVendorWallet
      ? linkedAccountAddress
      : address) ?? undefined;

  const { data: ethBalance } = useBalance({ address, chainId: base.id });
  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_BASE_MAINNET,
    chainId: base.id,
  });

  return (
    <>
      <Head>
        <title>{`Wallet | ${APP_NAME}`}</title>
      </Head>
      <Container>
        <Header>
          <Logo>{APP_NAME}</Logo>
          <WalletArea>
            {isConnected && address ? (
              <WalletMenu address={address} />
            ) : (
              <HeaderConnectWrap>
                <Wallet>
                  <ConnectWallet />
                </Wallet>
              </HeaderConnectWrap>
            )}
          </WalletArea>
        </Header>

        <Main>
          {!isConnected ? (
            <ConnectPrompt>
              <PromptIcon>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
                </svg>
              </PromptIcon>
              <PromptTitle>Connect Your Wallet</PromptTitle>
              <PromptText>
                Connect with Coinbase Smart Wallet to view your balance, fund your account, and manage transactions on Base.
              </PromptText>
              <ConnectButtonLabel>Click the button below to connect</ConnectButtonLabel>
              <ConnectButtonWrapper>
                <Wallet>
                  <ConnectWallet />
                </Wallet>
              </ConnectButtonWrapper>
            </ConnectPrompt>
          ) : (
            <DashboardGrid>
              {isConnectedAgentWallet && (
                <AgentWalletWarning>
                  You're connected with the agent wallet. Connect your vendor wallet to view and manage your vendor funds.
                </AgentWalletWarning>
              )}
              <Columns>
                <LeftColumn>
                  <VendorProfileCard address={vendorLookupAddress} />
                  <VendorMenuCard address={vendorLookupAddress} />
                </LeftColumn>

                <RightColumn>
                  <QuickActions>
                    <CardLabel>Quick Actions</CardLabel>
                    <ActionList>
                      <ActionButton as="a" href="/onboard?demo=true">
                        <ActionIcon>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                          </svg>
                        </ActionIcon>
                        Get Started — Onboarding
                      </ActionButton>
                      <ActionButton
                        as="a"
                        href={address ? `https://basescan.org/address/${address}` : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ActionIcon>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </ActionIcon>
                        View on BaseScan
                      </ActionButton>
                      <ActionButton disabled>
                        <ActionIcon>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                        </ActionIcon>
                        Cash Out (Coming Soon)
                      </ActionButton>
                      <ActionButton disabled>
                        <ActionIcon>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                        </ActionIcon>
                        Transaction History (Coming Soon)
                      </ActionButton>
                    </ActionList>
                  </QuickActions>

                  <BalanceCard>
                    <CardLabel>USDC Balance</CardLabel>
                    {isConnectedAgentWallet && (
                      <BalanceCardNote>Showing agent wallet — connect your vendor wallet for your funds</BalanceCardNote>
                    )}
                    <BalanceRow>
                      <BalanceAmount>
                        ${usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(2) : '0.00'}
                      </BalanceAmount>
                      <CurrencyTag>USDC</CurrencyTag>
                    </BalanceRow>
                    <SubBalance>
                      {ethBalance ? parseFloat(ethBalance.formatted).toFixed(6) : '0'} ETH (gas)
                    </SubBalance>
                    <CardActions>
                      <FundButton />
                    </CardActions>
                  </BalanceCard>

                  <AdiBalanceCard />
                  <AgentIdentityCard />
                </RightColumn>
              </Columns>
            </DashboardGrid>
          )}
        </Main>
      </Container>
    </>
  );
}

/* ─── animations ─────────────────────────────────────────────────── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const dropIn = keyframes`
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

/* ─── layout ─────────────────────────────────────────────────────── */
const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  color: #ffffff;
`;

const Logo = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  color: #ffffff;
`;

const WalletArea = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderConnectWrap = styled.div`
  color: #ffffff;
  & a, & button, & span {
    color: #ffffff !important;
  }
`;

const Main = styled.main`
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  animation: ${fadeIn} 0.4s ease;
`;

/* ─── wallet menu ─────────────────────────────────────────────────── */
const MenuRoot = styled.div`
  position: relative;
`;

const JazziconCircle = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const BigJazziconCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const TriggerButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 8px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  font-size: 0.85rem;
  font-weight: 500;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
    border-color: ${({ theme }) => theme.textMuted};
  }
`;

const TriggerAddress = styled.span`
  font-family: 'Space Grotesk', monospace;
  font-size: 0.82rem;
`;

const ChevronIcon = styled.span<{ $open: boolean }>`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.textMuted};
  transition: transform 0.2s ease;
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const DropdownPanel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 300px;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  animation: ${dropIn} 0.18s ease;
  z-index: 200;
`;

const DropSection = styled.div<{ $noBorder?: boolean; $noBottomPad?: boolean }>`
  padding: ${({ $noBottomPad }) => $noBottomPad ? '10px 14px 4px' : '12px 14px'};
  border-bottom: ${({ $noBorder, theme }) => $noBorder ? 'none' : `1px solid ${theme.border}`};
`;

const DropSectionTitle = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 8px;
`;

const IdentityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IdentityInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const IdentityLabel = styled.div`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 2px;
`;

const AddressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const FullAddress = styled.span`
  font-family: 'Space Grotesk', monospace;
  font-size: 0.88rem;
  font-weight: 600;
`;

const CopyBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textMuted};
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.borderSubtle};
  background: transparent;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.border};
  }
`;

const NetworkPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textMuted};
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.borderSubtle};
  padding: 2px 8px;
  border-radius: 20px;
`;

const BalanceItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.borderSubtle};
  }
`;

const BalanceItemIcon = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  flex-shrink: 0;
`;

const BalanceItemInfo = styled.div`
  flex: 1;
`;

const BalanceItemName = styled.div`
  font-size: 0.88rem;
  font-weight: 600;
`;

const BalanceItemSub = styled.div`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textMuted};
`;

const BalanceItemAmount = styled.div`
  font-family: 'Space Grotesk', monospace;
  font-size: 0.88rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const DropLink = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  text-decoration: none;
  transition: background 0.12s;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
    color: ${({ theme }) => theme.text};
  }
`;

const DropLinkIcon = styled.span<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  color: ${({ theme, $danger }) => $danger ? '#f87171' : theme.textMuted};
  flex-shrink: 0;
`;

const DisconnectItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #f87171;
  background: transparent;
  transition: background 0.12s;
  margin-bottom: 6px;

  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
  }
`;

/* ─── connect prompt ─────────────────────────────────────────────── */
const ConnectPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1.5rem;
  gap: 1.25rem;
  margin: 2rem 0;
  background: ${({ theme }) => theme.surface};
  border: 2px solid ${({ theme }) => theme.accent};
  border-radius: 16px;
  box-shadow: 0 0 0 1px ${({ theme }) => theme.border}, 0 4px 24px ${({ theme }) => theme.accent}20;
  color: #ffffff;
`;

const PromptIcon = styled.div`
  color: ${({ theme }) => theme.accent};
  margin-bottom: 0.25rem;
  & svg {
    width: 64px;
    height: 64px;
  }
`;

const PromptTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
  letter-spacing: -0.02em;
`;

const PromptText = styled.p`
  color: #f5f5f5;
  max-width: 420px;
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
`;

const ConnectButtonLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
`;

const ConnectButtonWrapper = styled.div`
  margin-top: 0.5rem;
  padding: 1.25rem 1.75rem;
  background: ${({ theme }) => theme.accentMuted ?? 'rgba(99, 102, 241, 0.12)'};
  border: 2px solid ${({ theme }) => theme.accent};
  border-radius: 12px;
`;

/* ─── dashboard cards ─────────────────────────────────────────────── */
const DashboardGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 1rem;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
`;

const MenuCardRoot = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
`;

const AgentWalletWarning = styled.div`
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.warning ? `${theme.warning}20` : 'rgba(245, 158, 11, 0.15)'};
  border: 1px solid ${({ theme }) => theme.warning ?? '#F59E0B'};
  border-radius: 8px;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.text};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
`;

const CardLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.75rem;
`;

const BalanceCard = styled(Card)``;

const BalanceCardNote = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.5rem;
`;

const BalanceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
`;

const BalanceAmount = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const CurrencyTag = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  background: ${({ theme }) => theme.accentMuted};
  padding: 2px 8px;
  border-radius: 4px;
`;

const SubBalance = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.25rem;
`;

const CardActions = styled.div`
  margin-top: 1rem;
  display: flex;
  gap: 0.75rem;
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
`;

const NetworkDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.success};
  animation: ${pulse} 2s ease infinite;
  flex-shrink: 0;
`;

const QuickActions = styled(Card)``;

const ActionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme, disabled }) => disabled ? theme.textMuted : theme.text};
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.borderSubtle};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
  transition: background 0.15s, border-color 0.15s;
  text-decoration: none;

  &:hover {
    ${({ disabled, theme }) => !disabled && `
      background: ${theme.surfaceHover};
      border-color: ${theme.border};
    `}
  }
`;

const ActionIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.accent};
`;

/* ─── ADI balance card ───────────────────────────────────────────── */
const AdiCard = styled(Card)`
  border-color: #7c3aed33;
  background: linear-gradient(135deg, ${({ theme }) => theme.surface} 80%, #7c3aed08 100%);
`;

const AdiCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const RefreshBtn = styled.button`
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  color: ${({ theme }) => theme.textMuted};
  background: transparent;
  transition: color 0.15s, background 0.15s;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.backgroundAlt};
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

const AdiBalanceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
`;

const AdiAmount = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const AdiSymbol = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: #7c3aed;
  background: #7c3aed18;
  padding: 2px 8px;
  border-radius: 4px;
`;

const AdiAddress = styled.code`
  display: block;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 4px;
`;

const AdiNetwork = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  font-size: 0.72rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textMuted};
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.borderSubtle};
  padding: 2px 8px;
  border-radius: 20px;
`;

const AdiSkeleton = styled.div`
  height: 52px;
  border-radius: 8px;
  background: ${({ theme }) => theme.backgroundAlt};
  animation: pulse 1.4s ease infinite;
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const AdiError = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.8rem;
  color: #ef4444;
  background: #ef444410;
  border: 1px solid #ef444433;
  border-radius: 8px;
  padding: 10px 12px;
`;

/* ─── agent identity card ────────────────────────────────────────── */
const IdentityCard = styled(Card)``;

const IdentityHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const IdentityBadge = styled.span<{ $registered?: boolean }>`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${({ theme, $registered }) => ($registered ? theme.success : theme.textMuted)};
  background: ${({ theme, $registered }) => ($registered ? `${theme.success}20` : theme.backgroundAlt)};
  border: 1px solid ${({ theme, $registered }) => ($registered ? theme.success : theme.borderSubtle)};
  padding: 2px 8px;
  border-radius: 20px;
`;

const IdentityDesc = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0 0 1rem;
  line-height: 1.5;
`;

const IdentityAgentId = styled.div`
  font-size: 0.8rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.textMuted};
`;

const IdentityActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const RegisterBtn = styled.button<{ $loading?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: 8px;
  cursor: ${({ $loading }) => ($loading ? 'wait' : 'pointer')};
  opacity: ${({ $loading }) => ($loading ? 0.8 : 1)};
  &:hover:not(:disabled) {
    opacity: 0.95;
  }
  &:disabled {
    cursor: not-allowed;
  }
`;

const IdentityLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const IdentityError = styled.div`
  font-size: 0.8rem;
  color: #ef4444;
  margin-top: 0.75rem;
`;

/* ─── vendor profile card ─────────────────────────────────────────── */
const VendorProfileCardRoot = styled(Card)`
  overflow: hidden;
`;

const VendorProfilePlaceholder = styled.div`
  font-size: 0.88rem;
  color: ${({ theme }) => theme.textMuted};
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

const VendorProfileCta = styled.a`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const VendorCoverPhoto = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
  background: ${({ theme }) => theme.backgroundAlt};
`;

const VendorProfileBody = styled.div`
  padding: 1rem 1.25rem;
`;

const VendorBizName = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: ${({ theme }) => theme.text};
`;

const VendorProspectCode = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.75rem;
`;

const VendorPreviewNote = styled.div`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textMuted};
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.borderSubtle};
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
  margin: 0 0 0.75rem;
`;

const VendorContactBlock = styled.div`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.75rem;
`;

const VendorContactLine = styled.div`
  margin-bottom: 2px;
`;

const VendorRating = styled.div`
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.textMuted};
  & span { margin-right: 4px; }
`;

const VendorTagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 1rem;
`;

const VendorTag = styled.span`
  font-size: 0.7rem;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 20px;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.borderSubtle};
  color: ${({ theme }) => theme.textMuted};
`;

const VendorSection = styled.section`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.borderSubtle};
`;

const VendorSectionTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.textMuted};
  margin: 0 0 0.5rem;
`;

const VendorEmptyState = styled.div`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.textMuted};
`;

const VendorMenuList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const VendorMenuItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.88rem;
  padding: 4px 0;
  border-bottom: 1px solid ${({ theme }) => theme.borderSubtle};
  &:last-child { border-bottom: none; }
`;

const VendorMenuPrice = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const VendorReview = styled.div`
  margin-bottom: 0.75rem;
  font-size: 0.82rem;
`;

const VendorReviewStars = styled.div`
  color: #eab308;
  font-size: 0.75rem;
  margin-bottom: 2px;
`;

const VendorReviewText = styled.div`
  color: ${({ theme }) => theme.text};
  font-style: italic;
`;

const VendorReviewAuthor = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 2px;
`;



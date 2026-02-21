import { useState, useRef, useEffect, useCallback, useReducer } from 'react';
import Head from 'next/head';
import styled, { keyframes } from 'styled-components';
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { FundButton } from '@coinbase/onchainkit/fund';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;
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
    token: USDC_ADDRESS,
    chainId: baseSepolia.id,
  });
  const { data: ethBalance } = useBalance({
    address: address as `0x${string}`,
    chainId: baseSepolia.id,
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
                  Base Sepolia
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
              href={`https://sepolia.basescan.org/address/${address}`}
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

function AgentFundingCard() {
  const [copied, setCopied] = useState(false);
  const { data: agentUsdc, isLoading } = useBalance({
    address: AGENT_WALLET || undefined,
    token: USDC_BASE_MAINNET,
    chainId: base.id,
    query: { enabled: !!AGENT_WALLET, refetchInterval: 30_000 },
  });

  const copyAddress = useCallback(async () => {
    if (!AGENT_WALLET) return;
    await navigator.clipboard.writeText(AGENT_WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, []);


  return (
    <FundingCard>
      <FundingHeader>
        <CardLabel style={{ margin: 0 }}>Agent Wallet — Marketing Funds</CardLabel>
        <FundingBadge>Base Mainnet</FundingBadge>
      </FundingHeader>

      <FundingBalanceRow>
        <FundingAmount>
          {isLoading ? '…' : agentUsdc ? parseFloat(agentUsdc.formatted).toFixed(2) : '0.00'}
        </FundingAmount>
        <FundingCurrency>USDC</FundingCurrency>
      </FundingBalanceRow>

      <FundingDesc>
        Funds the AI outreach agent — covers email sends, vendor discovery, and onchain transactions.
      </FundingDesc>

      {AGENT_WALLET && (
        <FundingAddressRow>
          <FundingAddress title={AGENT_WALLET}>
            {AGENT_WALLET.slice(0, 10)}…{AGENT_WALLET.slice(-8)}
          </FundingAddress>
          <FundingCopyBtn onClick={copyAddress} title="Copy address">
            {copied ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
            {copied ? 'Copied!' : 'Copy'}
          </FundingCopyBtn>
        </FundingAddressRow>
      )}

      <FundingActions>
        <FundButton />
        <FundingLink
          href={`https://basescan.org/address/${AGENT_WALLET}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Basescan
        </FundingLink>
      </FundingActions>
    </FundingCard>
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
          {isRegistered ? 'Registered' : 'Base Mainnet'}
        </IdentityBadge>
      </IdentityHeader>

      <IdentityDesc>
        Register this agent in the ERC-8004 Trustless Agents Identity Registry on Base mainnet.
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

export default function VendorDashboard() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address, chainId: baseSepolia.id });
  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS,
    chainId: baseSepolia.id,
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
              <Wallet>
                <ConnectWallet />
              </Wallet>
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
              <ConnectButtonWrapper>
                <Wallet>
                  <ConnectWallet />
                </Wallet>
              </ConnectButtonWrapper>
            </ConnectPrompt>
          ) : (
            <DashboardGrid>
              <BalanceCard>
                <CardLabel>USDC Balance</CardLabel>
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

              <AgentFundingCard />

              <AgentIdentityCard />

              <NetworkCard>
                <CardLabel>Network</CardLabel>
                <NetworkInfo>
                  <NetworkDot />
                  Base Sepolia (Testnet)
                </NetworkInfo>
                <NetworkDetail>
                  {address && <AddressDisplay>{address}</AddressDisplay>}
                </NetworkDetail>
              </NetworkCard>

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
                    href={address ? `https://sepolia.basescan.org/address/${address}` : '#'}
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
`;

const Logo = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
`;

const WalletArea = styled.div`
  display: flex;
  align-items: center;
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
  padding: 4rem 1rem;
  gap: 1rem;
`;

const PromptIcon = styled.div`
  color: ${({ theme }) => theme.accent};
  margin-bottom: 0.5rem;
`;

const PromptTitle = styled.h2`
  font-size: 1.5rem;
`;

const PromptText = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  max-width: 400px;
  line-height: 1.6;
`;

const ConnectButtonWrapper = styled.div`
  margin-top: 1rem;
`;

/* ─── dashboard cards ─────────────────────────────────────────────── */
const DashboardGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

const NetworkCard = styled(Card)``;

const NetworkInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
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

const NetworkDetail = styled.div`
  margin-top: 0.5rem;
`;

const AddressDisplay = styled.code`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textSecondary};
  background: ${({ theme }) => theme.backgroundAlt};
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
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


// ── Agent Funding Card ────────────────────────────────────────────────────────
const FundingCard = styled(Card)`
  border-color: #0052ff33;
  background: linear-gradient(135deg, ${({ theme }) => theme.surface} 80%, #0052ff06 100%);
  grid-column: span 2;

  @media (max-width: 700px) { grid-column: span 1; }
`;

const FundingHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const FundingBadge = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: #0052ff;
  background: #0052ff18;
  padding: 2px 8px;
  border-radius: 20px;
`;

const FundingBalanceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
`;

const FundingAmount = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const FundingCurrency = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: #0052ff;
  background: #0052ff18;
  padding: 2px 8px;
  border-radius: 4px;
`;

const FundingDesc = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 0.75rem;
  line-height: 1.5;
`;

const FundingAddressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const FundingAddress = styled.code`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textMuted};
  background: ${({ theme }) => theme.backgroundAlt};
  padding: 4px 10px;
  border-radius: 6px;
`;

const FundingCopyBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textSecondary};
  background: ${({ theme }) => theme.backgroundAlt};
  padding: 4px 10px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  &:hover { color: ${({ theme }) => theme.text}; background: ${({ theme }) => theme.border}; }
`;

const FundingActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const FundingLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  text-decoration: none;
  padding: 7px 14px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  transition: color 0.15s, border-color 0.15s;
  &:hover { color: ${({ theme }) => theme.text}; border-color: ${({ theme }) => theme.textSecondary}; }
`;

// ── ERC-8004 Identity ─────────────────────────────────────────────────────────
const IdentityCard = styled(Card)`
  border-left: 3px solid #6366f1;
`;
const IdentityHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;
const IdentityBadge = styled.span<{ $registered?: boolean }>`
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 3px 10px;
  border-radius: 20px;
  background: ${({ $registered }) => ($registered ? '#d1fae5' : '#e0e7ff')};
  color: ${({ $registered }) => ($registered ? '#065f46' : '#3730a3')};
`;
const IdentityDesc = styled.p`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 14px;
  line-height: 1.55;
`;
const IdentityAgentId = styled.div`
  font-size: 0.8rem;
  font-family: monospace;
  background: ${({ theme }) => theme.surface ?? '#f3f4f6'};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  padding: 6px 10px;
  margin-bottom: 12px;
  color: ${({ theme }) => theme.text};
  word-break: break-all;
`;
const IdentityActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;
const RegisterBtn = styled.button<{ $loading?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  cursor: ${({ $loading }) => ($loading ? 'not-allowed' : 'pointer')};
  background: #6366f1;
  color: #fff;
  opacity: ${({ $loading }) => ($loading ? 0.7 : 1)};
  transition: background 0.15s, opacity 0.15s;
  &:hover:not(:disabled) { background: #4f46e5; }
`;
const IdentityLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  text-decoration: none;
  padding: 7px 14px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  transition: color 0.15s, border-color 0.15s;
  &:hover { color: ${({ theme }) => theme.text}; border-color: ${({ theme }) => theme.textSecondary}; }
`;
const IdentityError = styled.div`
  font-size: 0.8rem;
  color: #e53e3e;
  margin-top: 8px;
`;

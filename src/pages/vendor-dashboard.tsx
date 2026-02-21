import { useState } from 'react';
import Head from 'next/head';
import styled, { keyframes } from 'styled-components';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  WalletDropdownLink,
} from '@coinbase/onchainkit/wallet';
import {
  Avatar,
  Name,
  Address,
  Identity,
} from '@coinbase/onchainkit/identity';
import { FundButton } from '@coinbase/onchainkit/fund';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const; // USDC on Base Sepolia

const APP_NAME = 'Pizza Bricks';

export default function VendorDashboard() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ethBalance } = useBalance({
    address,
    chainId: baseSepolia.id,
  });
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
            {isConnected && (
              <DisconnectBtn onClick={() => disconnect()} title="Switch wallet">
                Switch wallet
              </DisconnectBtn>
            )}
            <Wallet>
              <ConnectWallet>
                <Avatar className="h-6 w-6" />
                <Name />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                </Identity>
                <WalletDropdownLink icon="wallet" href="https://wallet.coinbase.com">
                  Coinbase Wallet
                </WalletDropdownLink>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
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

              <NetworkCard>
                <CardLabel>Network</CardLabel>
                <NetworkInfo>
                  <NetworkDot />
                  Base Sepolia (Testnet)
                </NetworkInfo>
                <NetworkDetail>
                  {address && (
                    <AddressDisplay>
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </AddressDisplay>
                  )}
                </NetworkDetail>
              </NetworkCard>

              <QuickActions>
                <CardLabel>Quick Actions</CardLabel>
                <ActionList>
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

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

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
  color: ${({ theme }) => theme.text};
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
  color: ${({ theme }) => theme.text};
`;

const PromptText = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  max-width: 400px;
  line-height: 1.6;
`;

const ConnectButtonWrapper = styled.div`
  margin-top: 1rem;
`;

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
  color: ${({ theme }) => theme.text};
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
  50% { opacity: 0.5; }
`;

const NetworkDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.success};
  animation: ${pulse} 2s ease infinite;
`;

const NetworkDetail = styled.div`
  margin-top: 0.5rem;
`;

const AddressDisplay = styled.code`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textSecondary};
  background: ${({ theme }) => theme.backgroundAlt};
  padding: 4px 8px;
  border-radius: 4px;
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
  transition: background 0.15s ease, border-color 0.15s ease;
  text-decoration: none;

  &:hover {
    ${({ disabled, theme }) => !disabled && `
      background: ${theme.surfaceHover};
      border-color: ${theme.border};
      color: ${theme.text};
    `}
  }
`;

const ActionIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.accent};
`;

const DisconnectBtn = styled.button`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textMuted};
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.border};
  background: transparent;
  transition: color 0.15s, border-color 0.15s;
  margin-right: 0.5rem;

  &:hover {
    color: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.textMuted};
  }
`;

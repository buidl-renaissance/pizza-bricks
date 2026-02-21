import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styled, { keyframes } from 'styled-components';
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { encodeFunctionData, parseAbi } from 'viem';
import { base } from 'wagmi/chains';

// ── ERC-8021 onboarding fee constants ─────────────────────────────────────────
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
const AGENT_WALLET = (process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS ?? '') as `0x${string}`;
const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE ?? 'bc_dmzc33g1';
const ERC8021_MARKER = '80218021802180218021802180218021';

function buildAttributionSuffix(code: string): string {
  const codeHex = Buffer.from(code, 'utf8').toString('hex');
  const lenHex = code.length.toString(16).padStart(2, '0');
  return lenHex + codeHex + '00' + ERC8021_MARKER;
}

const APP_NAME = 'Pizza Bricks';
const TOTAL_STEPS = 3;

// ── Demo data ────────────────────────────────────────────────────────────────
const DEMO_DATA = {
  id: 'demo',
  prospectCode: 'PB-2026-MIA1',
  status: 'link_sent',
  alreadyCompleted: false,
  businessName: "Mia's Cocinita",
  contactName: 'Mia Hernandez',
  preferredEmail: 'miacocinita7@gmail.com',
  phone: '+1 (720) 555-0101',
  walletAddress: null,
  // Extra profile data
  address: '1420 Larimer St, Denver, CO 80202',
  rating: '4.8',
  reviewCount: 312,
  coverPhotoUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  categories: ['Mexican Restaurant', 'Food Cart', 'Takeaway'],
  topReviews: [
    { text: 'Best street tacos in Denver! The pastor is unreal.', rating: 5, authorName: 'Carlos M.' },
    { text: 'Mia is so sweet and the food is always fresh. My go-to every Saturday.', rating: 5, authorName: 'Sandra K.' },
    { text: 'Hidden gem near Larimer Square. The birria quesatacos are worth the wait.', rating: 5, authorName: 'Priya S.' },
  ],
  menuItems: [
    { name: 'Street Tacos (3 pack)', price: '$9' },
    { name: 'Birria Quesatacos', price: '$13' },
    { name: 'Burrito Bowl', price: '$11' },
    { name: 'Elote Cup', price: '$5' },
    { name: 'Horchata (Large)', price: '$4' },
  ],
};

interface OnboardingData {
  id: string;
  prospectCode: string;
  status: string;
  alreadyCompleted: boolean;
  businessName: string;
  contactName: string | null;
  preferredEmail: string | null;
  phone: string | null;
  walletAddress: string | null;
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  const steps = ['Contact Info', 'Services', 'Wallet'];
  return (
    <StepBarRoot>
      {steps.map((label, i) => (
        <StepItem key={i}>
          <StepCircle $done={i < current} $active={i === current}>
            {i < current ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span>{i + 1}</span>
            )}
          </StepCircle>
          <StepLabel $active={i === current}>{label}</StepLabel>
          {i < steps.length - 1 && <StepLine $done={i < current} />}
        </StepItem>
      ))}
    </StepBarRoot>
  );
}

// ── Step 1: Contact info ──────────────────────────────────────────────────────
function ContactStep({
  data,
  onNext,
  token,
}: {
  data: OnboardingData & typeof DEMO_DATA;
  onNext: () => void;
  token?: string;
}) {
  const [name, setName] = useState(data.contactName || '');
  const [title, setTitle] = useState('Owner');
  const [email, setEmail] = useState(data.preferredEmail || '');
  const [phone, setPhone] = useState(data.phone || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');

    // Demo onboarding has no DB record to persist.
    if (!token || token === 'demo') {
      onNext();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/onboard/save-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          contactName: name,
          businessName: data.businessName,
          preferredEmail: email,
          phone,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setSaveError(payload.error ?? 'Failed to save contact details.');
        return;
      }
      onNext();
    } catch {
      setSaveError('Network error while saving details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepCard>
      <StepHeading>Confirm your details</StepHeading>
      <StepSub>We&apos;ve pre-filled this from your business profile. Make any corrections below.</StepSub>
      <Form onSubmit={handleSubmit}>
        <FormRow>
          <FormGroup>
            <Label>Your name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
          </FormGroup>
          <FormGroup>
            <Label>Your role</Label>
            <Select value={title} onChange={e => setTitle(e.target.value)}>
              <option>Owner</option>
              <option>Co-owner</option>
              <option>Manager</option>
              <option>Other</option>
            </Select>
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup>
            <Label>Email address</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </FormGroup>
          <FormGroup>
            <Label>Phone number</Label>
            <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(720) 555-0000" />
          </FormGroup>
        </FormRow>
        <FormGroup>
          <Label>Business name</Label>
          <Input value={data.businessName} readOnly style={{ opacity: 0.6 }} />
        </FormGroup>
        <FormGroup>
          <Label>Business address</Label>
          <Input value={data.address} readOnly style={{ opacity: 0.6 }} />
        </FormGroup>
        {saveError && <ErrorText>{saveError}</ErrorText>}
        <PrimaryBtn type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Continue →'}
        </PrimaryBtn>
      </Form>
    </StepCard>
  );
}

// ── Step 2: Services ──────────────────────────────────────────────────────────
const SERVICES = [
  { id: 'website', icon: '🌐', title: 'Free Website Build', desc: 'We design a custom site for your business at no cost. You review it before it goes live.', badge: null },
  { id: 'payments', icon: '💳', title: 'Digital Payment Wallet', desc: 'Accept USDC from customers instantly via a Coinbase Smart Wallet — no bank account needed.', badge: null },
  { id: 'marketing', icon: '📣', title: 'Marketing Materials', desc: 'QR codes, social media templates, and flyers designed to match your brand.', badge: null },
  { id: 'adi', icon: '🔑', title: 'ADI Token Generation', desc: 'Generate an Accumulate Digital Identifier (ADI) token to establish a portable, human-readable identity for your business on the Accumulate blockchain.', badge: 'Accumulate' },
  { id: 'hedera', icon: '♦️', title: 'Hedera Token Generation', desc: 'Mint a custom Hedera Token Service (HTS) token for your business — enabling loyalty programs, digital vouchers, or branded payment rails on the Hedera network.', badge: 'Hedera' },
];

interface TokenConfig { name: string; symbol: string; }
interface DeployResult { contractAddress: string; transactionHash: string | null; network: string; }
interface DeployState { status: 'idle' | 'deploying' | 'done' | 'error'; result?: DeployResult; error?: string; }

async function deployToken(endpoint: string, config: TokenConfig): Promise<DeployResult> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenName: config.name, tokenSymbol: config.symbol }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Deployment failed');
  return { contractAddress: data.contractAddress, transactionHash: data.transactionHash, network: data.network };
}

function TokenConfigPanel({ id, config, onChange, deployState }: {
  id: 'adi' | 'hedera';
  config: TokenConfig;
  onChange: (c: TokenConfig) => void;
  deployState: DeployState;
}) {
  const done = deployState.status === 'done';
  const deploying = deployState.status === 'deploying';
  return (
    <TokenPanel>
      {done && deployState.result ? (
        <TokenSuccess>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          <div>
            <TokenSuccessTitle>Token deployed on {deployState.result.network}</TokenSuccessTitle>
            <TokenSuccessAddr>{deployState.result.contractAddress}</TokenSuccessAddr>
            {deployState.result.transactionHash && (
              <TokenSuccessAddr style={{ fontSize: '0.68rem', opacity: 0.7 }}>tx: {deployState.result.transactionHash}</TokenSuccessAddr>
            )}
          </div>
        </TokenSuccess>
      ) : (
        <>
          <TokenPanelLabel>Configure your {id === 'adi' ? 'ADI' : 'Hedera'} token</TokenPanelLabel>
          <TokenFieldRow>
            <FormGroup>
              <Label>Token name</Label>
              <Input
                value={config.name}
                onChange={e => onChange({ ...config, name: e.target.value })}
                placeholder={id === 'adi' ? 'e.g. Mia Bucks' : 'e.g. Mia Points'}
                disabled={deploying}
              />
            </FormGroup>
            <FormGroup>
              <Label>Symbol</Label>
              <Input
                value={config.symbol}
                onChange={e => onChange({ ...config, symbol: e.target.value.toUpperCase().slice(0, 8) })}
                placeholder={id === 'adi' ? 'MIABK' : 'MIAP'}
                disabled={deploying}
              />
            </FormGroup>
          </TokenFieldRow>
          {deployState.status === 'error' && (
            <TokenError>{deployState.error}</TokenError>
          )}
        </>
      )}
    </TokenPanel>
  );
}

function ServicesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(['website', 'payments']));
  const [adiConfig, setAdiConfig] = useState<TokenConfig>({ name: '', symbol: '' });
  const [hederaConfig, setHederaConfig] = useState<TokenConfig>({ name: '', symbol: '' });
  const [adiDeploy, setAdiDeploy] = useState<DeployState>({ status: 'idle' });
  const [hederaDeploy, setHederaDeploy] = useState<DeployState>({ status: 'idle' });
  const [submitting, setSubmitting] = useState(false);

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const needsAdi = selected.has('adi') && adiDeploy.status !== 'done';
  const needsHedera = selected.has('hedera') && hederaDeploy.status !== 'done';

  const adiReady = !selected.has('adi') || adiDeploy.status === 'done' || (adiConfig.name.trim() && adiConfig.symbol.trim());
  const hederaReady = !selected.has('hedera') || hederaDeploy.status === 'done' || (hederaConfig.name.trim() && hederaConfig.symbol.trim());
  const canContinue = selected.size > 0 && adiReady && hederaReady && !submitting;

  const handleContinue = async () => {
    console.log('[handleContinue] needsAdi:', needsAdi, 'needsHedera:', needsHedera, 'selected:', [...selected]);
    setSubmitting(true);

    try {
      if (needsAdi) {
        setAdiDeploy({ status: 'deploying' });
        try {
          const result = await deployToken('/api/tokens/deploy-adi', adiConfig);
          setAdiDeploy({ status: 'done', result });
        } catch (err) {
          setAdiDeploy({ status: 'error', error: err instanceof Error ? err.message : 'Deployment failed' });
          setSubmitting(false);
          return;
        }
      }

      if (needsHedera) {
        setHederaDeploy({ status: 'deploying' });
        try {
          const result = await deployToken('/api/tokens/deploy-hedera', hederaConfig);
          setHederaDeploy({ status: 'done', result });
        } catch (err) {
          setHederaDeploy({ status: 'error', error: err instanceof Error ? err.message : 'Deployment failed' });
          setSubmitting(false);
          return;
        }
      }

      onNext();
    } finally {
      setSubmitting(false);
    }
  };

  const isDeploying = adiDeploy.status === 'deploying' || hederaDeploy.status === 'deploying';

  return (
    <StepCard>
      <StepHeading>What would you like help with?</StepHeading>
      <StepSub>Select everything that interests you — all options are free to start.</StepSub>
      <ServicesList>
        {SERVICES.map(s => (
          <div key={s.id}>
            <ServiceItem $selected={selected.has(s.id)} onClick={() => toggle(s.id)}>
              <ServiceCheck $selected={selected.has(s.id)}>
                {selected.has(s.id) && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </ServiceCheck>
              <ServiceIcon>{s.icon}</ServiceIcon>
              <ServiceText>
                <ServiceTitleRow>
                  <ServiceTitle>{s.title}</ServiceTitle>
                  {s.badge && <ServiceBadge>{s.badge}</ServiceBadge>}
                </ServiceTitleRow>
                <ServiceDesc>{s.desc}</ServiceDesc>
              </ServiceText>
            </ServiceItem>
            {s.id === 'adi' && selected.has('adi') && (
              <TokenConfigPanel
                id="adi"
                config={adiConfig}
                onChange={setAdiConfig}
                deployState={adiDeploy}
              />
            )}
            {s.id === 'hedera' && selected.has('hedera') && (
              <TokenConfigPanel
                id="hedera"
                config={hederaConfig}
                onChange={setHederaConfig}
                deployState={hederaDeploy}
              />
            )}
          </div>
        ))}
      </ServicesList>
      <FormGroup style={{ marginTop: '1rem' }}>
        <Label>Anything else you&apos;d like us to know?</Label>
        <Textarea rows={3} placeholder="e.g. We're open Tue–Sun, looking to add online ordering eventually..." />
      </FormGroup>
      <StepNav>
        <BackBtn type="button" onClick={onBack} disabled={submitting}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </BackBtn>
        <PrimaryBtn onClick={handleContinue} disabled={!canContinue}>
          {isDeploying ? 'Deploying…' : 'Continue →'}
        </PrimaryBtn>
      </StepNav>
    </StepCard>
  );
}

// ── Step 3: Wallet ────────────────────────────────────────────────────────────
function WalletStep({ onNext, onBack, token }: { onNext: () => void; onBack: () => void; token?: string }) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [feePaid, setFeePaid] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [feeError, setFeeError] = useState('');

  const usdcTransferData = encodeFunctionData({
    abi: parseAbi(['function transfer(address to, uint256 amount) returns (bool)']),
    functionName: 'transfer',
    args: [AGENT_WALLET, BigInt(10_000)], // 0.01 USDC (1 cent), 6 decimals
  });
  const attributedData = (usdcTransferData + buildAttributionSuffix(BUILDER_CODE)) as `0x${string}`;

  const { sendTransaction, data: txHash, isPending: txPending, error: txError } = useSendTransaction();
  const { isSuccess: txConfirmed, isLoading: txWaiting } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!txConfirmed || !txHash || confirming || feePaid) return;
    setConfirming(true);
    setFeeError('');
    fetch('/api/onboard/confirm-fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token ?? 'demo', txHash }),
    })
      .then(r => r.json())
      .then(j => {
        if (j.success) setFeePaid(true);
        else setFeeError(j.error ?? 'Verification failed');
      })
      .catch(() => setFeeError('Network error verifying payment'))
      .finally(() => setConfirming(false));
  }, [txConfirmed, txHash, token, confirming, feePaid]);

  const [savingWallet, setSavingWallet] = useState(false);

  const handlePayFee = async () => {
    setFeeError('');
    if (chainId !== base.id) {
      try {
        await switchChainAsync({ chainId: base.id });
      } catch (e) {
        setFeeError('Please switch your wallet to Base mainnet to pay the fee.');
        return;
      }
    }
    sendTransaction({ to: USDC_BASE, data: attributedData, chainId: base.id });
  };

  const handleNext = useCallback(async () => {
    if (address && token && token !== 'demo') {
      setSavingWallet(true);
      try {
        await fetch('/api/onboard/save-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, walletAddress: address }),
        });
      } catch {
        // non-blocking; still proceed to done step
      } finally {
        setSavingWallet(false);
      }
    }
    onNext();
  }, [address, token, onNext]);

  const isBusy = txPending || txWaiting || confirming || savingWallet;

  return (
    <StepCard>
      <StepHeading>Set up your payment wallet</StepHeading>
      <StepSub>
        Connect a free Coinbase Smart Wallet to receive USDC payments from customers.
        No seed phrase, no crypto knowledge required.
      </StepSub>

      <WalletBox $connected={isConnected}>
        {!isConnected ? (
          <>
            <WalletIcon>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
              </svg>
            </WalletIcon>
            <WalletBoxText>Connect or create your wallet in seconds</WalletBoxText>
            <Wallet><ConnectWallet /></Wallet>
          </>
        ) : (
          <>
            <ConnectedCheck>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </ConnectedCheck>
            <ConnectedLabel>Wallet connected</ConnectedLabel>
            <ConnectedAddress>{address?.slice(0, 10)}…{address?.slice(-8)}</ConnectedAddress>
            <ConnectedNote>This address will receive your USDC payments on Base.</ConnectedNote>
          </>
        )}
      </WalletBox>

      {isConnected && (
        <FeeBox $paid={feePaid}>
          <FeeBoxRow>
            <div>
              <FeeTitle>{feePaid ? 'Activation fee paid ✓' : 'Activate on Base'}</FeeTitle>
              <FeeSub>
                {feePaid
                  ? `Your account is live on Base mainnet.`
                  : 'One-time $0.01 (1¢) USDC fee — recorded onchain with your Pizza Bricks builder code.'}
              </FeeSub>
            </div>
            <FeeAmount $paid={feePaid}>$0.01 USDC</FeeAmount>
          </FeeBoxRow>

          {!feePaid && (
            <>
              {(feeError || txError) && (
                <FeeError>{feeError || txError?.message?.split('\n')[0]}</FeeError>
              )}
              <FeeBtn type="button" onClick={handlePayFee} disabled={isBusy}>
                {txPending ? 'Confirm in wallet…' : txWaiting ? 'Waiting for block…' : confirming ? 'Verifying…' : 'Pay $0.01 to activate →'}
              </FeeBtn>
            </>
          )}
        </FeeBox>
      )}

      <WalletBenefits>
        {['Accept USDC from any customer', 'Cash out to USD anytime', 'Zero monthly fees', 'Secured by Coinbase'].map(b => (
          <WalletBenefit key={b}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {b}
          </WalletBenefit>
        ))}
      </WalletBenefits>

      <StepNav>
        <BackBtn type="button" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </BackBtn>
        {isConnected && feePaid && (
          <PrimaryBtn onClick={handleNext} disabled={savingWallet}>
            {savingWallet ? 'Saving…' : 'Finish &rarr;'}
          </PrimaryBtn>
        )}
        {(!isConnected || !feePaid) && (
          <SkipBtn onClick={handleNext} disabled={savingWallet}>
            {savingWallet ? 'Saving…' : 'Skip for now'}
          </SkipBtn>
        )}
      </StepNav>
    </StepCard>
  );
}

// ── Done ──────────────────────────────────────────────────────────────────────
function DoneStep({ data }: { data: Pick<typeof DEMO_DATA, 'prospectCode' | 'businessName' | 'contactName'> }) {
  return (
    <StepCard $center>
      <SuccessRing>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </SuccessRing>
      <StepHeading>You&apos;re all set! 🎉</StepHeading>
      <StepSub>
        Welcome to Pizza Bricks, <strong>{data.contactName || data.businessName}</strong>!
        Your account is ready and our team has been notified.
      </StepSub>

      <ProspectCard>
        <ProspectLabel>Your Prospect ID</ProspectLabel>
        <ProspectCode>{data.prospectCode}</ProspectCode>
        <ProspectNote>Reference this ID in all communications with our team.</ProspectNote>
      </ProspectCard>

      <NextList>
        {[
          { done: true,  text: 'Contact info confirmed' },
          { done: true,  text: 'Services selected' },
          { done: true,  text: 'Wallet connected' },
          { done: false, text: "We'll reach out within 24 hours to begin your free website build" },
          { done: false, text: 'Payment instructions will be sent to your email' },
        ].map((item, i) => (
          <NextItem key={i} $done={item.done}>{item.text}</NextItem>
        ))}
      </NextList>

      <PrimaryBtn as="a" href="/vendor-dashboard" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center', marginTop: '0.5rem' }}>
        Go to my dashboard &rarr;
      </PrimaryBtn>
    </StepCard>
  );
}

// ── Business profile sidebar ─────────────────────────────────────────────────
function ProfileSidebar({ data }: { data: typeof DEMO_DATA }) {
  return (
    <Sidebar>
      <CoverPhoto src={data.coverPhotoUrl} alt={data.businessName} />
      <SidebarBody>
        <BizName>{data.businessName}</BizName>
        <RatingRow>
          <Stars>{'★'.repeat(Math.round(parseFloat(data.rating)))}</Stars>
          <RatingNum>{data.rating}</RatingNum>
          <ReviewCount>({data.reviewCount} reviews)</ReviewCount>
        </RatingRow>
        <BizAddress>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          {data.address}
        </BizAddress>
        <TagRow>
          {data.categories.map(c => <Tag key={c}>{c}</Tag>)}
        </TagRow>

        <SidebarSection>
          <SidebarSectionTitle>Popular Items</SidebarSectionTitle>
          {data.menuItems.map(m => (
            <MenuItem key={m.name}>
              <MenuItemName>{m.name}</MenuItemName>
              <MenuItemPrice>{m.price}</MenuItemPrice>
            </MenuItem>
          ))}
        </SidebarSection>

        <SidebarSection>
          <SidebarSectionTitle>What customers say</SidebarSectionTitle>
          {data.topReviews.map((r, i) => (
            <ReviewItem key={i}>
              <ReviewStars>{'★'.repeat(r.rating)}</ReviewStars>
              <ReviewText>&ldquo;{r.text}&rdquo;</ReviewText>
              <ReviewAuthor>— {r.authorName}</ReviewAuthor>
            </ReviewItem>
          ))}
        </SidebarSection>
      </SidebarBody>
    </Sidebar>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OnboardPage() {
  const router = useRouter();
  const { token, demo } = router.query;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<(OnboardingData & typeof DEMO_DATA) | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    if (demo === 'true') {
      setData(DEMO_DATA as OnboardingData & typeof DEMO_DATA);
      setLoading(false);
      return;
    }

    if (!token || typeof token !== 'string') {
      setError('No onboarding token provided.');
      setLoading(false);
      return;
    }

    fetch(`/api/onboard/verify-token?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (!d.valid) { setError(d.error || 'Invalid link.'); return; }
        setData({ ...DEMO_DATA, ...d });
        if (d.alreadyCompleted) setStep(3);
      })
      .catch(() => setError('Failed to load. Please try again.'))
      .finally(() => setLoading(false));
  }, [router.isReady, token, demo]);

  const next = useCallback(() => setStep(s => s + 1), []);
  const prev = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  return (
    <>
      <Head><title>Get Started | {APP_NAME}</title></Head>
      <Page>
        <TopBar>
          <Logo>{APP_NAME}</Logo>
          {data && (
            <ProspectBadge>
              Prospect&nbsp;<strong>{data.prospectCode}</strong>
            </ProspectBadge>
          )}
        </TopBar>

        {loading ? (
          <LoadingState><Spinner /></LoadingState>
        ) : error ? (
          <ErrorState>
            <span style={{ fontSize: '2rem' }}>⚠</span>
            <h2>Link not found</h2>
            <p>{error}</p>
          </ErrorState>
        ) : data ? (
          <Body>
            <ProfileSidebar data={data as typeof DEMO_DATA} />
            <FormArea>
              <FormHeader>
                <FormTitle>Welcome to Pizza Bricks</FormTitle>
                <FormSub>Let&apos;s get <strong>{data.businessName}</strong> set up in a few quick steps.</FormSub>
              </FormHeader>
              <StepBar current={step} />
              <FormContent>
                {step === 0 && (
                  <ContactStep
                    data={data as OnboardingData & typeof DEMO_DATA}
                    onNext={next}
                    token={typeof token === 'string' ? token : undefined}
                  />
                )}
                {step === 1 && <ServicesStep onNext={next} onBack={prev} />}
                {step === 2 && <WalletStep onNext={next} onBack={prev} token={typeof token === 'string' ? token : undefined} />}
                {step === 3 && <DoneStep data={data} />}
              </FormContent>
            </FormArea>
          </Body>
        ) : null}
      </Page>
    </>
  );
}

// ── Animations ────────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const spin = keyframes`to { transform: rotate(360deg); }`;

// ── Layout ────────────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface};
  position: sticky;
  top: 0;
  z-index: 50;
`;

const Logo = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
`;

const ProspectBadge = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  padding: 4px 14px;
  border-radius: 20px;
  font-family: 'Space Grotesk', monospace;
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;

  @media (max-width: 860px) {
    flex-direction: column;
  }
`;

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = styled.aside`
  width: 300px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.surface};
  border-right: 1px solid ${({ theme }) => theme.border};
  overflow-y: auto;

  @media (max-width: 860px) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }
`;

const CoverPhoto = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
`;

const SidebarBody = styled.div`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const BizName = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
`;

const RatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.82rem;
`;

const Stars = styled.span`
  color: #f59e0b;
  letter-spacing: 1px;
`;

const RatingNum = styled.span`
  font-weight: 700;
`;

const ReviewCount = styled.span`
  color: ${({ theme }) => theme.textMuted};
`;

const BizAddress = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textMuted};
  line-height: 1.4;

  svg { margin-top: 2px; flex-shrink: 0; }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
`;

const Tag = styled.span`
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  background: ${({ theme }) => theme.accentMuted};
  color: ${({ theme }) => theme.accent};
  border: 1px solid ${({ theme }) => theme.accent}33;
`;

const SidebarSection = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SidebarSectionTitle = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 2px;
`;

const MenuItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  padding: 4px 0;
  border-bottom: 1px solid ${({ theme }) => theme.borderSubtle};
`;

const MenuItemName = styled.span`
  color: ${({ theme }) => theme.textSecondary};
`;

const MenuItemPrice = styled.span`
  font-weight: 600;
  font-family: 'Space Grotesk', monospace;
  color: ${({ theme }) => theme.text};
`;

const ReviewItem = styled.div`
  padding: 8px 10px;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 8px;
`;

const ReviewStars = styled.div`
  font-size: 0.7rem;
  color: #f59e0b;
  letter-spacing: 1px;
  margin-bottom: 3px;
`;

const ReviewText = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.45;
  margin: 0 0 3px;
`;

const ReviewAuthor = styled.div`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textMuted};
  font-style: italic;
`;

// ── Form area ─────────────────────────────────────────────────────────────────
const FormArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem 2.5rem 4rem;
  max-width: 620px;
  animation: ${fadeUp} 0.35s ease;

  @media (max-width: 860px) {
    padding: 1.5rem 1rem 3rem;
  }
`;

const FormHeader = styled.div`
  margin-bottom: 1.75rem;
`;

const FormTitle = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
`;

const FormSub = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.9rem;
`;

const FormContent = styled.div`
  animation: ${fadeUp} 0.25s ease;
`;

// ── Step bar ──────────────────────────────────────────────────────────────────
const StepBarRoot = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
`;

const StepItem = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1;
  &:last-child { flex: 0 0 auto; }
`;

const StepCircle = styled.div<{ $done?: boolean; $active?: boolean }>`
  width: 27px;
  height: 27px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  flex-shrink: 0;
  background: ${({ $done, $active, theme }) =>
    $done ? theme.success : $active ? theme.accent : theme.backgroundAlt};
  color: ${({ $done, $active }) => ($done || $active ? 'white' : 'inherit')};
  border: 2px solid ${({ $done, $active, theme }) =>
    $done ? theme.success : $active ? theme.accent : theme.border};
  transition: all 0.2s;
`;

const StepLabel = styled.span<{ $active?: boolean }>`
  font-size: 0.75rem;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  color: ${({ $active, theme }) => ($active ? theme.text : theme.textMuted)};
  white-space: nowrap;
`;

const StepLine = styled.div<{ $done?: boolean }>`
  flex: 1;
  height: 2px;
  background: ${({ $done, theme }) => ($done ? theme.success : theme.border)};
  margin: 0 8px;
  transition: background 0.2s;
`;

// ── Step card ─────────────────────────────────────────────────────────────────
const StepCard = styled.div<{ $center?: boolean }>`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px;
  padding: 1.75rem;
  ${({ $center }) => $center && 'text-align: center;'}
`;

const StepHeading = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
`;

const StepSub = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  line-height: 1.55;
`;

// ── Form controls ─────────────────────────────────────────────────────────────
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.875rem;

  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Label = styled.label`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textSecondary};
`;

const Input = styled.input`
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.text};
  font-size: 0.875rem;
  &:focus { outline: none; border-color: ${({ theme }) => theme.accent}; }
`;

const Select = styled.select`
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.text};
  font-size: 0.875rem;
  &:focus { outline: none; border-color: ${({ theme }) => theme.accent}; }
`;

const Textarea = styled.textarea`
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.text};
  font-size: 0.875rem;
  resize: vertical;
  &:focus { outline: none; border-color: ${({ theme }) => theme.accent}; }
`;

const PrimaryBtn = styled.button`
  margin-top: 0.75rem;
  padding: 11px 26px;
  background: ${({ theme }) => theme.accent};
  color: white;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 600;
  align-self: flex-start;
  transition: background 0.15s, opacity 0.15s;
  cursor: pointer;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.accentHover}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

// ── Services step ─────────────────────────────────────────────────────────────
const ServicesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

const ServiceItem = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 10px;
  border: 1.5px solid ${({ $selected, theme }) => $selected ? theme.accent : theme.border};
  background: ${({ $selected, theme }) => $selected ? theme.accentMuted : theme.backgroundAlt};
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover { border-color: ${({ theme }) => theme.accent}; }
`;

const ServiceCheck = styled.div<{ $selected: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border: 2px solid ${({ $selected, theme }) => $selected ? theme.accent : theme.border};
  background: ${({ $selected, theme }) => $selected ? theme.accent : 'transparent'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  transition: all 0.15s;
`;

const ServiceIcon = styled.span`
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const ServiceText = styled.div``;

const ServiceTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 2px;
`;

const ServiceTitle = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
`;

const ServiceBadge = styled.span`
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 20px;
  background: ${({ theme }) => `${theme.accent}18`};
  color: ${({ theme }) => theme.accent};
  border: 1px solid ${({ theme }) => `${theme.accent}44`};
  white-space: nowrap;
`;

const ServiceDesc = styled.div`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.4;
`;

const TokenPanel = styled.div`
  margin: -2px 0 6px;
  padding: 14px 16px;
  border: 1.5px solid ${({ theme }) => theme.accent}55;
  border-top: none;
  border-radius: 0 0 10px 10px;
  background: ${({ theme }) => theme.accentMuted};
`;

const TokenPanelLabel = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.accent};
  margin-bottom: 10px;
`;

const TokenFieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const TokenSuccess = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: ${({ theme }) => theme.success};

  svg { margin-top: 2px; flex-shrink: 0; }
`;

const TokenSuccessTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.success};
  margin-bottom: 3px;
`;

const TokenSuccessAddr = styled.div`
  font-size: 0.72rem;
  font-family: 'Space Grotesk', monospace;
  color: ${({ theme }) => theme.textMuted};
  word-break: break-all;
`;

const TokenError = styled.div`
  margin-top: 8px;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.error ?? '#ef4444'};
  background: ${({ theme }) => theme.error ? `${theme.error}10` : '#ef444410'};
  border: 1px solid ${({ theme }) => theme.error ? `${theme.error}33` : '#ef444433'};
  border-radius: 6px;
  padding: 8px 12px;
`;

// ── Wallet step ───────────────────────────────────────────────────────────────
const WalletBox = styled.div<{ $connected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.875rem;
  padding: 2rem 1.5rem;
  border: 1.5px dashed ${({ $connected, theme }) => $connected ? theme.success : theme.border};
  border-radius: 12px;
  text-align: center;
  background: ${({ $connected, theme }) => $connected ? `${theme.success}0A` : 'transparent'};
  transition: border-color 0.2s, background 0.2s;
  margin-bottom: 1.25rem;
`;

const WalletIcon = styled.div`
  color: ${({ theme }) => theme.accent};
`;

const WalletBoxText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const ConnectedCheck = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ theme }) => theme.success};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ConnectedLabel = styled.div`
  font-weight: 700;
  color: ${({ theme }) => theme.success};
`;

const ConnectedAddress = styled.code`
  font-size: 0.82rem;
  background: ${({ theme }) => theme.backgroundAlt};
  padding: 5px 12px;
  border-radius: 6px;
`;

const ConnectedNote = styled.p`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.textMuted};
  max-width: 280px;
`;

const WalletBenefits = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 0.5rem;

  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const WalletBenefit = styled.li`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textSecondary};

  svg { color: ${({ theme }) => theme.success}; flex-shrink: 0; }
`;

const SkipBtn = styled.button`
  display: block;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  background: none;
  text-decoration: underline;
  cursor: pointer;
  &:hover { color: ${({ theme }) => theme.text}; }
`;

// ── Onboarding fee box ─────────────────────────────────────────────────────────
const FeeBox = styled.div<{ $paid: boolean }>`
  margin: 0.75rem 0;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1.5px solid ${({ $paid, theme }) => $paid ? theme.success : theme.accent};
  background: ${({ $paid, theme }) => $paid ? `${theme.success}12` : `${theme.accent}0d`};
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FeeBoxRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const FeeTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 2px;
`;

const FeeSub = styled.div`
  font-size: 0.775rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.45;
`;

const FeeAmount = styled.div<{ $paid: boolean }>`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${({ $paid, theme }) => $paid ? theme.success : theme.accent};
  white-space: nowrap;
`;

const FeeError = styled.div`
  font-size: 0.78rem;
  color: #e53e3e;
  padding: 6px 10px;
  background: #e53e3e18;
  border-radius: 6px;
`;

const FeeBtn = styled.button`
  padding: 10px 20px;
  background: ${({ theme }) => theme.accent};
  color: white;
  border-radius: 9px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
  transition: background 0.15s, opacity 0.15s;
  &:hover:not(:disabled) { background: ${({ theme }) => theme.accentHover}; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

const StepNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;

  /* cancel out the default top margin PrimaryBtn carries */
  & > button, & > a {
    margin-top: 0;
  }
`;

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1.5px solid ${({ theme }) => theme.border};
  background: transparent;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.backgroundAlt};
  }
`;

// ── Done step ─────────────────────────────────────────────────────────────────
const SuccessRing = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: ${({ theme }) => `${theme.success}18`};
  border: 2px solid ${({ theme }) => `${theme.success}44`};
  color: ${({ theme }) => theme.success};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

const ProspectCard = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: 1.25rem auto;
  padding: 1.25rem 2.5rem;
  background: ${({ theme }) => theme.accentMuted};
  border: 1px solid ${({ theme }) => theme.accent}44;
  border-radius: 12px;
`;

const ProspectLabel = styled.div`
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.accent};
`;

const ProspectCode = styled.div`
  font-family: 'Space Grotesk', monospace;
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: 0.04em;
`;

const ProspectNote = styled.div`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.textMuted};
  max-width: 220px;
  text-align: center;
`;

const NextList = styled.ul`
  list-style: none;
  text-align: left;
  display: inline-flex;
  flex-direction: column;
  gap: 0.45rem;
  margin: 1rem auto 1.5rem;
`;

const NextItem = styled.li<{ $done?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: ${({ $done, theme }) => ($done ? theme.textMuted : theme.textSecondary)};
  text-decoration: ${({ $done }) => ($done ? 'line-through' : 'none')};

  &::before {
    content: '${({ $done }) => ($done ? '✓' : '○')}';
    color: ${({ $done, theme }) => ($done ? theme.success : theme.textMuted)};
    font-size: 0.75rem;
  }
`;

// ── Loading / error ───────────────────────────────────────────────────────────
const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 4rem;
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${({ theme }) => theme.border};
  border-top-color: ${({ theme }) => theme.accent};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 4rem;
  text-align: center;
  color: ${({ theme }) => theme.textSecondary};
  h2 { color: ${({ theme }) => theme.text}; }
`;

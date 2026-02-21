import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled, { keyframes } from 'styled-components';

export interface VendorResult {
  id: string;
  googlePlaceId?: string | null;
  facebookPageUrl?: string | null;
  instagramUrl?: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  rating: string | null;
  reviewCount: number | null;
  categories: string | null;
  hasWebsite: boolean;
  websiteUrl: string | null;
  websiteQuality: string | null;
  email: string | null;
  coverPhotoUrl: string | null;
  topReviews: string | null;
  menuItems: string | null;
  recentPosts: string | null;
  status: string;
  notes: string | null;
  /** Resend delivery status for latest sent outreach (sent | delivered | bounced | failed | delivery_delayed) */
  deliveryStatus?: string | null;
  deliveryStatusAt?: string | null;
}

export interface DraftPreview {
  emailId: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string | null;
  subject: string;
  bodyHtml: string;
  menuItems: { name: string; description: string; price?: string }[];
}

export interface Review {
  text: string;
  rating: number;
  authorName: string;
  publishTime?: string;
}

export function hasEnrichmentData(vendor: VendorResult): boolean {
  if (vendor.email) return true;
  if (!vendor.recentPosts) return false;
  try {
    const parsed = JSON.parse(vendor.recentPosts);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

export function parseReviews(vendor: VendorResult): Review[] {
  if (!vendor.topReviews) return [];
  try {
    const parsed = JSON.parse(vendor.topReviews);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseCategories(categories: string | null): string[] {
  if (!categories) return [];
  try {
    return JSON.parse(categories);
  } catch {
    return [];
  }
}

export function formatCategory(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  return '\u2605'.repeat(full) + (half ? '\u00BD' : '') + '\u2606'.repeat(5 - full - half);
}

export function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const OUTREACH_PATH = '/ops?tab=campaigns-outreach';

export function OutreachTab() {
  const router = useRouter();
  const [radius, setRadius] = useState(5);
  const [vendors, setVendors] = useState<VendorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('food truck');
  const [error, setError] = useState<string | null>(null);
  const [resendConfigured, setResendConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/resend/status')
      .then((r) => r.json())
      .then((d) => setResendConfigured(d.configured === true))
      .catch(() => setResendConfigured(false));
  }, []);
  const [sourceInfo, setSourceInfo] = useState<{
    google: number;
    googleError: string | null;
  } | null>(null);
  const [enrichmentLogs, setEnrichmentLogs] = useState<Record<string, string[]>>({});
  const [showLogs, setShowLogs] = useState(false);
  const [draftPreview, setDraftPreview] = useState<DraftPreview | null>(null);
  const [draftingVendorId, setDraftingVendorId] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [preparedVendors, setPreparedVendors] = useState<Record<string, {
    prospectId: string;
    siteId: string;
    siteUrl?: string;
    status: 'preparing' | 'polling' | 'ready' | 'error';
  }>>({});
  const [sendConfirm, setSendConfirm] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendEmail = useCallback(async () => {
    if (!draftPreview) return;
    setSendingEmail(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/outreach/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: draftPreview.emailId }),
      });
      const data = await res.json();

      if (res.status === 401 && data.code === 'RESEND_NOT_CONFIGURED') {
        setSendResult({ success: false, message: 'Resend is not configured. Set RESEND_API_KEY.' });
        setSendingEmail(false);
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Send failed');

      setSendResult({ success: true, message: `Sent to ${data.sentTo}` });
      setSendConfirm(false);
      setDraftPreview(null);
      setTimeout(() => setSendResult(null), 2000);
    } catch (err) {
      setSendResult({ success: false, message: err instanceof Error ? err.message : 'Send failed' });
    } finally {
      setSendingEmail(false);
    }
  }, [draftPreview]);

  const closeDraftModal = useCallback(() => {
    setDraftPreview(null);
    setSendConfirm(false);
    setSendResult(null);
  }, []);

  const handlePrepareOutreach = useCallback(async (vendor: VendorResult) => {
    if (!vendor.email) {
      setError('Vendor has no email address');
      return;
    }
    setPreparedVendors(prev => ({
      ...prev,
      [vendor.id]: { prospectId: '', siteId: '', status: 'preparing' },
    }));
    setError(null);
    try {
      const res = await fetch('/api/outreach/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vendor.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Prepare failed');
      setPreparedVendors(prev => ({
        ...prev,
        [vendor.id]: {
          prospectId: data.prospectId,
          siteId: data.siteId,
          status: 'polling',
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prepare failed');
      setPreparedVendors(prev => ({
        ...prev,
        [vendor.id]: { prospectId: '', siteId: '', status: 'error' },
      }));
    }
  }, []);

  useEffect(() => {
    const polling = Object.entries(preparedVendors)
      .filter(([, p]) => p.status === 'polling' && p.siteId);
    if (polling.length === 0) return;

    const interval = setInterval(async () => {
      for (const [vendorId, prep] of polling) {
        try {
          const res = await fetch(`/api/outreach/site-status/${prep.siteId}`);
          if (!res.ok) continue;
          const data = await res.json();
          const url = data.url;
          const status = data.status;
          if (url || ['published', 'pending_review'].includes(status)) {
            setPreparedVendors(prev => ({
              ...prev,
              [vendorId]: {
                ...prev[vendorId],
                siteUrl: url || prev[vendorId]?.siteUrl,
                status: 'ready',
              },
            }));
          }
        } catch {
          /* ignore */
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [preparedVendors]);

  const handleDraftPreview = useCallback(async (vendor: VendorResult) => {
    const prep = preparedVendors[vendor.id];
    const siteUrl = prep?.status === 'ready' ? prep.siteUrl : undefined;

    setDraftingVendorId(vendor.id);
    try {
      const res = await fetch('/api/outreach/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vendor.id, siteUrl: siteUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Draft failed');
      setDraftPreview({
        emailId: data.emailId,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        menuItems: data.menuItems || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate draft');
    } finally {
      setDraftingVendorId(null);
    }
  }, [preparedVendors]);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSourceInfo(null);

    try {
      const res = await fetch('/api/outreach/search-vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          radiusMiles: radius,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setVendors(data.vendors || []);
      setSourceInfo(data.sources ? {
        google: data.sources.google,
        googleError: data.sources.googleError || null,
      } : null);
      setEnrichmentLogs(data.enrichmentLogs || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <HeaderRow>
          <div>
            <Subtitle>Discover local businesses and initiate outreach campaigns</Subtitle>
          </div>
          {resendConfigured === true ? (
            <EmailBadge $connected>Email via Resend</EmailBadge>
          ) : resendConfigured === false ? (
            <EmailBadge $connected={false}>Resend not configured</EmailBadge>
          ) : null}
        </HeaderRow>
      </Header>

      <SearchPanel>
        <SearchRow>
          <InputGroup>
            <Label>Keyword</Label>
            <TextInput
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="food truck, restaurant, market vendor..."
            />
          </InputGroup>

          <InputGroup>
            <Label>Search Radius: {radius} {radius === 1 ? 'mile' : 'miles'}</Label>
            <SliderWrapper>
              <RangeInput
                type="range"
                min={1}
                max={25}
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
              />
              <SliderLabels>
                <span>1 mi</span>
                <span>25 mi</span>
              </SliderLabels>
            </SliderWrapper>
          </InputGroup>

          <SearchButton onClick={handleSearch} disabled={loading}>
            {loading ? 'Scanning...' : 'Search'}
          </SearchButton>
        </SearchRow>
      </SearchPanel>

      <ResultsHeader>
        <ResultCount>
          {vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'} found
          {sourceInfo && (
            <SourceSummary>
              ({sourceInfo.google} from Google Places — sorted by website need)
            </SourceSummary>
          )}
        </ResultCount>
      </ResultsHeader>

      {error && (
        <ErrorBanner>{error}</ErrorBanner>
      )}

      {sourceInfo?.googleError && (
        <ErrorBanner>Google Places: {sourceInfo.googleError}</ErrorBanner>
      )}

      {Object.keys(enrichmentLogs).length > 0 && (
        <LogsToggle onClick={() => setShowLogs(!showLogs)}>
          {showLogs ? 'Hide' : 'Show'} Enrichment Logs
        </LogsToggle>
      )}

      {showLogs && Object.keys(enrichmentLogs).length > 0 && (
        <LogsPanel>
          {Object.entries(enrichmentLogs).map(([name, logs]) => (
            <LogEntry key={name}>
              <LogVendorName>{name}</LogVendorName>
              {logs.map((line, i) => (
                <LogLine key={i} $isError={line.startsWith('ERROR')}>{line}</LogLine>
              ))}
            </LogEntry>
          ))}
        </LogsPanel>
      )}

      {loading ? (
        <LoadingState>
          <Spinner />
          <span>Scanning Google Places & enriching vendors...</span>
        </LoadingState>
      ) : vendors.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📍</EmptyIcon>
          <EmptyText>No vendors found. Try adjusting your search radius or keyword.</EmptyText>
        </EmptyState>
      ) : (
        <VendorGrid>
          {vendors.map(vendor => {
            const reviews = parseReviews(vendor).slice(0, 3);
            const isDrafting = draftingVendorId === vendor.id;

            return (
            <VendorCard key={vendor.id}>
              <CoverPhoto>
                {vendor.coverPhotoUrl ? (
                  <img src={vendor.coverPhotoUrl} alt={vendor.name} />
                ) : (
                  <PlaceholderCover>
                    <span>{vendor.name.charAt(0)}</span>
                  </PlaceholderCover>
                )}
                <SourceBadges>
                  {vendor.googlePlaceId && <Badge $variant="google">Google</Badge>}
                  {hasEnrichmentData(vendor) && <Badge $variant="enriched">Enriched</Badge>}
                </SourceBadges>
                <StatusBadge $status={vendor.status}>{vendor.status}</StatusBadge>
              </CoverPhoto>

              <CardBody>
                <VendorName>{vendor.name}</VendorName>
                <Categories>
                  {parseCategories(vendor.categories).map(cat => (
                    <CategoryTag key={cat}>{formatCategory(cat)}</CategoryTag>
                  ))}
                </Categories>

                <InfoRow>
                  <InfoItem>
                    <InfoLabel>Rating</InfoLabel>
                    <InfoValue>{vendor.rating} ({vendor.reviewCount})</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Email</InfoLabel>
                    <InfoValue $muted={!vendor.email}>
                      {vendor.email || 'Not found'}
                    </InfoValue>
                  </InfoItem>
                </InfoRow>

                <InfoRow>
                  <InfoItem>
                    <InfoLabel>Phone</InfoLabel>
                    <InfoValue>{vendor.phone || 'N/A'}</InfoValue>
                  </InfoItem>
                </InfoRow>

                {vendor.address && (
                  <Address>{vendor.address}</Address>
                )}

                {(vendor.websiteUrl || vendor.facebookPageUrl || vendor.instagramUrl) && (
                  <SocialLinks>
                    {vendor.websiteUrl && (
                      <SocialLink href={vendor.websiteUrl} target="_blank" rel="noopener noreferrer" $variant="website">
                        <SocialIcon viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/></SocialIcon>
                        Website
                        {vendor.websiteQuality && vendor.websiteQuality !== 'good' && (
                          <WebsiteQualityTag $quality={vendor.websiteQuality}>
                            {vendor.websiteQuality}
                          </WebsiteQualityTag>
                        )}
                      </SocialLink>
                    )}
                    {vendor.facebookPageUrl && (
                      <SocialLink href={vendor.facebookPageUrl} target="_blank" rel="noopener noreferrer" $variant="facebook">
                        <SocialIcon viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="currentColor"/></SocialIcon>
                        Facebook
                      </SocialLink>
                    )}
                    {vendor.instagramUrl && (
                      <SocialLink href={vendor.instagramUrl} target="_blank" rel="noopener noreferrer" $variant="instagram">
                        <SocialIcon viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" fill="currentColor"/></SocialIcon>
                        Instagram
                      </SocialLink>
                    )}
                  </SocialLinks>
                )}
                {!vendor.websiteUrl && (
                  <NoWebsiteTag>No website</NoWebsiteTag>
                )}

                {reviews.length > 0 && (
                  <CardSection>
                    <SectionTitle>Recent Reviews</SectionTitle>
                    {reviews.map((review, i) => (
                      <ReviewItem key={i}>
                        <ReviewHeader>
                          <ReviewAuthor>{review.authorName}</ReviewAuthor>
                          <ReviewMeta>
                            <ReviewStars>{renderStars(review.rating)}</ReviewStars>
                            {review.publishTime && (
                              <ReviewTime>{timeAgo(review.publishTime)}</ReviewTime>
                            )}
                          </ReviewMeta>
                        </ReviewHeader>
                        <ReviewText>
                          {review.text.length > 150
                            ? review.text.slice(0, 150) + '...'
                            : review.text}
                        </ReviewText>
                      </ReviewItem>
                    ))}
                  </CardSection>
                )}

                <CardActions>
                  {(() => {
                    const prep = preparedVendors[vendor.id];
                    const isPreparing = prep?.status === 'preparing' || prep?.status === 'polling';
                    const isReady = prep?.status === 'ready';
                    const isError = prep?.status === 'error';
                    return (
                      <>
                        {prep?.status === 'ready' && prep.siteUrl && (
                          <SiteReadyRow>
                            <SiteReadyLabel>Site ready:</SiteReadyLabel>
                            <SiteLink href={prep.siteUrl} target="_blank" rel="noopener noreferrer">
                              {prep.siteUrl}
                            </SiteLink>
                          </SiteReadyRow>
                        )}
                        <ActionRow>
                          <PrepareButton
                            onClick={() => handlePrepareOutreach(vendor)}
                            disabled={isPreparing || !vendor.email}
                            $status={prep?.status}
                          >
                            {isPreparing ? 'Generating site...' : isReady ? 'Site ready' : isError ? 'Retry prepare' : 'Prepare outreach'}
                          </PrepareButton>
                          <DraftButton
                            onClick={() => handleDraftPreview(vendor)}
                            disabled={isDrafting || !isReady}
                          >
                            {isDrafting ? 'Drafting...' : 'Preview Draft'}
                          </DraftButton>
                          <CampaignButton disabled>
                            Send (Disabled)
                          </CampaignButton>
                        </ActionRow>
                      </>
                    );
                  })()}
                </CardActions>
              </CardBody>
            </VendorCard>
            );
          })}
        </VendorGrid>
      )}

      {draftPreview && (
        <ModalOverlay onClick={closeDraftModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Draft Email — {draftPreview.vendorName}</ModalTitle>
              <CloseButton onClick={closeDraftModal}>&times;</CloseButton>
            </ModalHeader>

            <ModalBody>
              <ModalSection>
                <ModalSectionTitle>Subject</ModalSectionTitle>
                <SubjectLine>{draftPreview.subject}</SubjectLine>
              </ModalSection>

              <ModalSection>
                <ModalSectionTitle>Email Body</ModalSectionTitle>
                <EmailPreview dangerouslySetInnerHTML={{ __html: draftPreview.bodyHtml }} />
              </ModalSection>

              {draftPreview.menuItems.length > 0 && (
                <ModalSection>
                  <ModalSectionTitle>
                    Inferred Menu Items ({draftPreview.menuItems.length})
                  </ModalSectionTitle>
                  <MenuGrid>
                    {draftPreview.menuItems.map((item, i) => (
                      <MenuItemCard key={i}>
                        <MenuItemName>
                          {item.name}
                          {item.price && <MenuItemPrice>${item.price}</MenuItemPrice>}
                        </MenuItemName>
                        <MenuItemDesc>{item.description}</MenuItemDesc>
                      </MenuItemCard>
                    ))}
                  </MenuGrid>
                </ModalSection>
              )}
            </ModalBody>

            <ModalFooter>
              {sendResult ? (
                <SendResultBanner $success={sendResult.success}>
                  {sendResult.success ? '✓ ' : '✗ '}{sendResult.message}
                </SendResultBanner>
              ) : sendConfirm ? (
                <ConfirmRow>
                  <ConfirmText>
                    Send to <strong>{draftPreview.vendorEmail}</strong>?
                  </ConfirmText>
                  <ConfirmActions>
                    <ModalCloseBtn onClick={() => setSendConfirm(false)}>Cancel</ModalCloseBtn>
                    <SendConfirmBtn onClick={handleSendEmail} disabled={sendingEmail}>
                      {sendingEmail ? 'Sending...' : 'Confirm Send'}
                    </SendConfirmBtn>
                  </ConfirmActions>
                </ConfirmRow>
              ) : (
                <>
                  <ModalFooterNote>
                    Draft saved (ID: {draftPreview.emailId.slice(0, 8)}...)
                  </ModalFooterNote>
                  <FooterActions>
                    <ModalCloseBtn onClick={closeDraftModal}>Close</ModalCloseBtn>
                    {draftPreview.vendorEmail ? (
                      <SendBtn onClick={() => setSendConfirm(true)}>
                        Send Email
                      </SendBtn>
                    ) : (
                      <SendBtnDisabled disabled title="No email address found for this vendor">
                        No Email
                      </SendBtnDisabled>
                    )}
                  </FooterActions>
                </>
              )}
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

const Container = styled.div`
  max-width: 1200px;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

const EmailBadge = styled.span<{ $connected: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
  background: ${p => p.$connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)'};
  color: ${p => p.$connected ? '#10B981' : '#6366F1'};
  border: 1px solid ${p => p.$connected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.25)'};
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const Subtitle = styled.p`
  color: ${p => p.theme.textSecondary};
  font-size: 1rem;
  margin: 0;
`;

const SearchPanel = styled.div`
  background: ${p => p.theme.surface};
  border: 1px solid ${p => p.theme.border};
  border-radius: ${p => p.theme.borderRadius};
  padding: 24px;
  margin-bottom: 24px;
`;

const SearchRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const InputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 0.85rem;
  font-weight: 500;
  color: ${p => p.theme.textSecondary};
  font-family: 'Space Grotesk', sans-serif;
`;

const TextInput = styled.input`
  background: ${p => p.theme.background};
  border: 1px solid ${p => p.theme.border};
  border-radius: ${p => p.theme.borderRadius};
  padding: 10px 14px;
  color: ${p => p.theme.text};
  font-size: 0.95rem;
  transition: border-color 0.15s ease;

  &:focus {
    border-color: ${p => p.theme.accent};
    outline: none;
  }

  &::placeholder {
    color: ${p => p.theme.textMuted};
  }
`;

const SliderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const RangeInput = styled.input`
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  background: ${p => p.theme.border};
  border-radius: 3px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: ${p => p.theme.accent};
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.1s ease;

    &:hover {
      transform: scale(1.15);
    }
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: ${p => p.theme.accent};
    border-radius: 50%;
    border: none;
    cursor: pointer;
  }
`;

const SliderLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: ${p => p.theme.textMuted};
`;

const SearchButton = styled.button`
  background: ${p => p.theme.accent};
  color: white;
  padding: 10px 28px;
  border-radius: ${p => p.theme.borderRadius};
  font-size: 0.95rem;
  font-weight: 600;
  transition: background 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${p => p.theme.accentHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResultsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const ResultCount = styled.span`
  font-size: 0.9rem;
  color: ${p => p.theme.textMuted};
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const SourceSummary = styled.span`
  font-size: 0.8rem;
  color: ${p => p.theme.textMuted};
  opacity: 0.7;
`;

const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid ${p => p.theme.danger};
  border-radius: ${p => p.theme.borderRadius};
  padding: 12px 16px;
  color: ${p => p.theme.danger};
  font-size: 0.9rem;
  margin-bottom: 16px;
`;

const LogsToggle = styled.button`
  padding: 6px 16px;
  border-radius: ${p => p.theme.borderRadius};
  font-size: 0.8rem;
  color: ${p => p.theme.textMuted};
  border: 1px solid ${p => p.theme.border};
  margin-bottom: 16px;
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: ${p => p.theme.text};
    border-color: ${p => p.theme.textMuted};
  }
`;

const LogsPanel = styled.div`
  background: ${p => p.theme.background};
  border: 1px solid ${p => p.theme.border};
  border-radius: ${p => p.theme.borderRadius};
  padding: 16px;
  margin-bottom: 16px;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
`;

const LogEntry = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const LogVendorName = styled.div`
  font-weight: 700;
  color: ${p => p.theme.accent};
  margin-bottom: 4px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
`;

const LogLine = styled.div<{ $isError?: boolean }>`
  color: ${p => p.$isError ? p.theme.danger : p.theme.textSecondary};
  line-height: 1.6;
  padding-left: 12px;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px 0;
  color: ${p => p.theme.textSecondary};
  font-size: 0.95rem;
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${p => p.theme.border};
  border-top-color: ${p => p.theme.accent};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 0;
`;

const EmptyIcon = styled.span`
  font-size: 2.5rem;
`;

const EmptyText = styled.p`
  color: ${p => p.theme.textMuted};
  font-size: 0.95rem;
`;

const VendorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
`;

const VendorCard = styled.div`
  background: ${p => p.theme.surface};
  border: 1px solid ${p => p.theme.border};
  border-radius: ${p => p.theme.borderRadius};
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: ${p => p.theme.accent};
    box-shadow: ${p => p.theme.glow};
  }
`;

const CoverPhoto = styled.div`
  position: relative;
  height: 120px;
  background: ${p => p.theme.backgroundAlt};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PlaceholderCover = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${p => p.theme.accent}33, ${p => p.theme.backgroundAlt});

  span {
    font-size: 2.5rem;
    font-weight: 700;
    color: ${p => p.theme.accent};
    font-family: 'Space Grotesk', sans-serif;
  }
`;

const SourceBadges = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
`;

const Badge = styled.span<{ $variant: 'google' | 'enriched' }>`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: 'Space Grotesk', sans-serif;
  background: ${p => p.$variant === 'enriched' ? '#10B981' : '#4285F4'};
  color: white;
`;

const StatusBadge = styled.span<{ $status: string }>`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  font-family: 'Space Grotesk', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${p => {
    switch (p.$status) {
      case 'candidate': return p.theme.accentMuted;
      case 'contacted': return 'rgba(245, 158, 11, 0.2)';
      case 'responded': return 'rgba(34, 197, 94, 0.2)';
      case 'converted': return 'rgba(34, 197, 94, 0.3)';
      case 'dismissed': return 'rgba(107, 114, 128, 0.2)';
      default: return p.theme.accentMuted;
    }
  }};
  color: ${p => {
    switch (p.$status) {
      case 'candidate': return p.theme.accent;
      case 'contacted': return p.theme.warning;
      case 'responded': return p.theme.success;
      case 'converted': return p.theme.success;
      case 'dismissed': return p.theme.textMuted;
      default: return p.theme.accent;
    }
  }};
`;

const CardBody = styled.div`
  padding: 16px;
`;

const VendorName = styled.h3`
  font-size: 1.15rem;
  color: ${p => p.theme.text};
  margin-bottom: 8px;
`;

const Categories = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
`;

const CategoryTag = styled.span`
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  background: ${p => p.theme.backgroundAlt};
  color: ${p => p.theme.textSecondary};
  border: 1px solid ${p => p.theme.borderSubtle};
`;

const InfoRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
`;

const InfoItem = styled.div`
  flex: 1;
`;

const InfoLabel = styled.div`
  font-size: 0.72rem;
  color: ${p => p.theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
  font-family: 'Space Grotesk', sans-serif;
`;

const InfoValue = styled.div<{ $muted?: boolean }>`
  font-size: 0.88rem;
  color: ${p => p.$muted ? p.theme.textMuted : p.theme.text};
  font-style: ${p => p.$muted ? 'italic' : 'normal'};
`;

const Address = styled.div`
  font-size: 0.85rem;
  color: ${p => p.theme.textSecondary};
  margin-bottom: 14px;
  line-height: 1.4;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
`;

const SocialLink = styled.a<{ $variant: 'facebook' | 'instagram' | 'website' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s ease;
  color: white;
  background: ${p => {
    switch (p.$variant) {
      case 'facebook': return '#1877F2';
      case 'instagram': return 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)';
      case 'website': return '#6366F1';
    }
  }};

  &:hover {
    opacity: 0.85;
  }
`;

const WebsiteQualityTag = styled.span<{ $quality: string }>`
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-left: 2px;
  background: ${p => {
    switch (p.$quality) {
      case 'poor': return 'rgba(239, 68, 68, 0.3)';
      case 'basic': return 'rgba(245, 158, 11, 0.3)';
      default: return 'rgba(255,255,255,0.2)';
    }
  }};
  color: white;
`;

const NoWebsiteTag = styled.div`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${p => p.theme.warning};
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  margin-bottom: 14px;
`;

const SocialIcon = styled.svg`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
`;

const CardSection = styled.div`
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid ${p => p.theme.borderSubtle};
`;

const SectionTitle = styled.div`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${p => p.theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
  font-family: 'Space Grotesk', sans-serif;
`;

const ReviewItem = styled.div`
  margin-bottom: 10px;
  padding: 8px 10px;
  background: ${p => p.theme.backgroundAlt};
  border-radius: 6px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ReviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const ReviewAuthor = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${p => p.theme.text};
`;

const ReviewMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ReviewStars = styled.span`
  font-size: 0.75rem;
  color: #F59E0B;
  letter-spacing: 1px;
`;

const ReviewTime = styled.span`
  font-size: 0.7rem;
  color: ${p => p.theme.textMuted};
`;

const ReviewText = styled.p`
  font-size: 0.82rem;
  color: ${p => p.theme.textSecondary};
  line-height: 1.45;
  margin: 0;
`;

const CardActions = styled.div`
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid ${p => p.theme.borderSubtle};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const SiteReadyRow = styled.div`
  width: 100%;
  margin-bottom: 8px;
  font-size: 0.8rem;
`;

const SiteReadyLabel = styled.span`
  color: ${p => p.theme.textMuted};
  margin-right: 6px;
`;

const SiteLink = styled.a`
  color: ${p => p.theme.accent};
  text-decoration: none;
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }
`;

const PrepareButton = styled.button<{ $status?: string }>`
  padding: 10px;
  border-radius: ${p => p.theme.borderRadius};
  font-size: 0.85rem;
  font-weight: 600;
  background: ${p => p.$status === 'ready' ? 'rgba(16, 185, 129, 0.15)' : p.theme.backgroundAlt};
  color: ${p => p.$status === 'ready' ? '#10B981' : p.theme.text};
  border: 1px solid ${p => p.$status === 'ready' ? 'rgba(16, 185, 129, 0.3)' : p.theme.border};
  transition: background 0.15s ease, opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: ${p => p.$status === 'ready' ? 'rgba(16, 185, 129, 0.25)' : p.theme.borderSubtle};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DraftButton = styled.button`
  flex: 1;
  padding: 10px;
  border-radius: ${p => p.theme.borderRadius};
  font-size: 0.85rem;
  font-weight: 600;
  background: ${p => p.theme.accent};
  color: white;
  transition: background 0.15s ease, opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: ${p => p.theme.accentHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CampaignButton = styled.button`
  flex: 1;
  padding: 10px;
  border-radius: ${p => p.theme.borderRadius};
  font-size: 0.85rem;
  font-weight: 600;
  background: ${p => p.theme.border};
  color: ${p => p.theme.textMuted};
  cursor: not-allowed;
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(24px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
  animation: ${fadeIn} 0.15s ease;
`;

const ModalContent = styled.div`
  background: ${p => p.theme.surface};
  border: 1px solid ${p => p.theme.border};
  border-radius: 12px;
  width: 100%;
  max-width: 640px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: ${slideUp} 0.2s ease;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${p => p.theme.borderSubtle};
`;

const ModalTitle = styled.h2`
  font-size: 1.1rem;
  color: ${p => p.theme.text};
  font-family: 'Space Grotesk', sans-serif;
`;

const CloseButton = styled.button`
  font-size: 1.5rem;
  color: ${p => p.theme.textMuted};
  line-height: 1;
  padding: 0 4px;
  transition: color 0.15s ease;

  &:hover {
    color: ${p => p.theme.text};
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1;
`;

const ModalSection = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ModalSectionTitle = styled.div`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${p => p.theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
  font-family: 'Space Grotesk', sans-serif;
`;

const SubjectLine = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${p => p.theme.text};
  padding: 10px 14px;
  background: ${p => p.theme.backgroundAlt};
  border-radius: 6px;
`;

const EmailPreview = styled.div`
  font-size: 0.92rem;
  color: ${p => p.theme.text};
  line-height: 1.65;
  padding: 16px;
  background: ${p => p.theme.backgroundAlt};
  border-radius: 6px;

  p {
    margin: 0 0 12px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  b, strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
  }
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
`;

const MenuItemCard = styled.div`
  padding: 10px 12px;
  background: ${p => p.theme.backgroundAlt};
  border-radius: 6px;
  border: 1px solid ${p => p.theme.borderSubtle};
`;

const MenuItemName = styled.div`
  font-size: 0.88rem;
  font-weight: 600;
  color: ${p => p.theme.text};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
`;

const MenuItemPrice = styled.span`
  font-size: 0.8rem;
  color: ${p => p.theme.accent};
  font-weight: 700;
  white-space: nowrap;
`;

const MenuItemDesc = styled.div`
  font-size: 0.78rem;
  color: ${p => p.theme.textSecondary};
  line-height: 1.4;
`;

const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid ${p => p.theme.borderSubtle};
`;

const ModalFooterNote = styled.span`
  font-size: 0.78rem;
  color: ${p => p.theme.textMuted};
`;

const ModalCloseBtn = styled.button`
  padding: 8px 20px;
  border-radius: ${p => p.theme.borderRadius};
  font-size: 0.85rem;
  font-weight: 600;
  background: ${p => p.theme.border};
  color: ${p => p.theme.text};
  transition: background 0.15s ease;

  &:hover {
    background: ${p => p.theme.borderSubtle};
  }
`;

const FooterActions = styled.div`
  display: flex;
  gap: 8px;
`;

const SendBtn = styled.button`
  padding: 8px 24px;
  border-radius: ${p => p.theme.borderRadius};
  font-size: 0.85rem;
  font-weight: 600;
  background: ${p => p.theme.accent};
  color: white;
  transition: background 0.15s ease, opacity 0.15s ease;

  &:hover {
    background: ${p => p.theme.accentHover};
  }
`;

const SendBtnDisabled = styled.button`
  padding: 8px 24px;
  border-radius: ${p => p.theme.borderRadius};
  font-size: 0.85rem;
  font-weight: 600;
  background: ${p => p.theme.border};
  color: ${p => p.theme.textMuted};
  cursor: not-allowed;
`;

const ConfirmRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
`;

const ConfirmText = styled.span`
  font-size: 0.85rem;
  color: ${p => p.theme.text};

  strong {
    color: ${p => p.theme.accent};
  }
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const SendConfirmBtn = styled.button`
  padding: 8px 24px;
  border-radius: ${p => p.theme.borderRadius};
  font-size: 0.85rem;
  font-weight: 600;
  background: #10B981;
  color: white;
  transition: background 0.15s ease, opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SendResultBanner = styled.div<{ $success: boolean }>`
  width: 100%;
  text-align: center;
  padding: 10px;
  border-radius: 6px;
  font-size: 0.88rem;
  font-weight: 600;
  background: ${p => p.$success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  color: ${p => p.$success ? '#10B981' : '#EF4444'};
  border: 1px solid ${p => p.$success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'};
`;

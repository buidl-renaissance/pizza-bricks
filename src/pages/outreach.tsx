import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

export default function OutreachPage() {
  const router = useRouter();
  const [radius, setRadius] = useState(5);
  const [vendors, setVendors] = useState<VendorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('food truck');
  const [demoOnly, setDemoOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gmailAccount, setGmailAccount] = useState<string | null>(null);

  // Inbox / reply processing state
  const [checkingReplies, setCheckingReplies] = useState(false);
  const [analyzingReplies, setAnalyzingReplies] = useState(false);
  const [inboxResult, setInboxResult] = useState<{
    newReplies: number;
    processed?: number;
    results?: { vendorName: string; intent: string; confidence: number; summary: string; prospectCode?: string; followUpSent?: boolean }[];
  } | null>(null);

  const [sourceInfo, setSourceInfo] = useState<{
    google: number;
    googleError: string | null;
  } | null>(null);
  const [enrichmentLogs, setEnrichmentLogs] = useState<Record<string, string[]>>({});
  const [showLogs, setShowLogs] = useState(false);
  const [draftPreview, setDraftPreview] = useState<DraftPreview | null>(null);
  const [draftingVendorId, setDraftingVendorId] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendConfirm, setSendConfirm] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [quickSendingId, setQuickSendingId] = useState<string | null>(null);

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

      if (res.status === 401 && data.code === 'GMAIL_NOT_CONFIGURED') {
        window.location.href = '/api/auth/gmail';
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Send failed');

      setSendResult({ success: true, message: `Sent to ${data.sentTo}` });
      setSendConfirm(false);

      // Update vendor status in local state
      setVendors(prev => prev.map(v =>
        v.id === draftPreview.vendorId ? { ...v, status: 'contacted' } : v
      ));

      // Auto-close modal after 2s
      setTimeout(() => {
        setDraftPreview(null);
        setSendResult(null);
      }, 2000);
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

  const handleDraftPreview = useCallback(async (vendor: VendorResult) => {
    setDraftingVendorId(vendor.id);
    try {
      const res = await fetch('/api/outreach/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vendor.id }),
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
  }, []);

  // Draft + send in one click from the vendor card
  const handleQuickSend = useCallback(async (vendor: VendorResult) => {
    if (!vendor.email) return;
    setQuickSendingId(vendor.id);
    try {
      // Draft first
      const draftRes = await fetch('/api/outreach/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vendor.id }),
      });
      const draftData = await draftRes.json();
      if (!draftRes.ok) throw new Error(draftData.error || 'Draft failed');

      // Then send immediately
      const sendRes = await fetch('/api/outreach/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: draftData.emailId }),
      });
      const sendData = await sendRes.json();

      if (sendRes.status === 401 && sendData.code === 'GMAIL_NOT_CONFIGURED') {
        window.location.href = '/api/auth/gmail';
        return;
      }
      if (!sendRes.ok) throw new Error(sendData.error || 'Send failed');

      // Update vendor status in local state
      setVendors(prev => prev.map(v =>
        v.id === vendor.id ? { ...v, status: 'contacted' } : v
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setQuickSendingId(null);
    }
  }, []);

  const [processingInbox, setProcessingInbox] = useState(false);

  const handleCheckReplies = async () => {
    setCheckingReplies(true);
    setInboxResult(null);
    try {
      const res = await fetch('/api/outreach/check-replies', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check replies');
      setInboxResult({ newReplies: data.newReplies });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check replies');
    } finally {
      setCheckingReplies(false);
    }
  };

  const handleAnalyzeReplies = async () => {
    setAnalyzingReplies(true);
    try {
      const res = await fetch('/api/outreach/analyze-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyzeAll: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze replies');
      setInboxResult(prev => ({
        newReplies: prev?.newReplies ?? 0,
        processed: data.processed,
        results: data.results,
      }));
      if (data.results?.length > 0) {
        setVendors(prev => prev.map(v => {
          const match = data.results.find((r: { vendorId: string; intent: string }) => r.vendorId === v.id);
          if (!match) return v;
          if (match.intent === 'interested') return { ...v, status: 'onboarding' };
          if (match.intent === 'not_interested') return { ...v, status: 'dismissed' };
          return v;
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze replies');
    } finally {
      setAnalyzingReplies(false);
    }
  };

  // Combined: check then immediately analyze
  const handleProcessInbox = async () => {
    setProcessingInbox(true);
    setInboxResult(null);
    try {
      const checkRes = await fetch('/api/outreach/check-replies', { method: 'POST' });
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.error || 'Failed to check replies');

      const analyzeRes = await fetch('/api/outreach/analyze-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyzeAll: true }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error || 'Failed to analyze replies');

      setInboxResult({
        newReplies: checkData.newReplies,
        processed: analyzeData.processed,
        results: analyzeData.results,
      });

      if (analyzeData.results?.length > 0) {
        setVendors(prev => prev.map(v => {
          const match = analyzeData.results.find((r: { vendorId: string; intent: string }) => r.vendorId === v.id);
          if (!match) return v;
          if (match.intent === 'interested') return { ...v, status: 'onboarding' };
          if (match.intent === 'not_interested') return { ...v, status: 'dismissed' };
          return v;
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process inbox');
    } finally {
      setProcessingInbox(false);
    }
  };

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
          demoOnly,
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
    <Page>
      <Header>
        <HeaderRow>
          <div>
            <Title>Vendor Outreach</Title>
            <Subtitle>Discover local businesses and initiate outreach campaigns</Subtitle>
          </div>
          {gmailAccount ? (
            <GmailBadge $connected>Gmail: {gmailAccount}</GmailBadge>
          ) : (
            <GmailBadge
              as="a"
              href="/api/auth/gmail"
              $connected={false}
            >
              Connect Gmail
            </GmailBadge>
          )}
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
        <DemoToggleRow>
          <DemoToggleLabel>
            <DemoToggleInput
              type="checkbox"
              checked={demoOnly}
              onChange={e => setDemoOnly(e.target.checked)}
            />
            Demo mode <DemoToggleHint>(skip live API calls — use seeded test vendors only)</DemoToggleHint>
          </DemoToggleLabel>
        </DemoToggleRow>
      </SearchPanel>

      <InboxPanel>
        <InboxTitleRow>
          <InboxTitle>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            Inbox
          </InboxTitle>
          <InboxActions>
            <InboxButton onClick={handleCheckReplies} disabled={checkingReplies || analyzingReplies || processingInbox}>
              {checkingReplies ? 'Checking...' : 'Check'}
            </InboxButton>
            <InboxButton onClick={handleAnalyzeReplies} disabled={checkingReplies || analyzingReplies || processingInbox}>
              {analyzingReplies ? 'Analyzing...' : 'Analyze'}
            </InboxButton>
            <InboxButton
              $primary
              onClick={handleProcessInbox}
              disabled={checkingReplies || analyzingReplies || processingInbox}
            >
              {processingInbox ? 'Processing...' : '⚡ Process Inbox'}
            </InboxButton>
          </InboxActions>
        </InboxTitleRow>

        {inboxResult && (
          <InboxResultsBox>
            <InboxStat>
              {inboxResult.newReplies > 0
                ? `${inboxResult.newReplies} new ${inboxResult.newReplies === 1 ? 'reply' : 'replies'} found. `
                : 'No new replies. '}
              {inboxResult.processed !== undefined && (
                inboxResult.processed === 0
                  ? 'Nothing to analyze.'
                  : `${inboxResult.processed} analyzed — auto-replies sent.`
              )}
            </InboxStat>
            {inboxResult.results?.map((r, i) => (
              <ReplyResultRow key={i} $intent={r.intent}>
                <ReplyResultName>{r.vendorName}</ReplyResultName>
                <IntentBadge $intent={r.intent}>{r.intent.replace(/_/g, ' ')}</IntentBadge>
                <ReplyResultSummary>{r.summary}</ReplyResultSummary>
                <ReplyResultMeta>
                  {r.autoReplySent && <AutoReplyBadge>↩ auto-replied</AutoReplyBadge>}
                  {r.prospectCode && (
                    <ProspectCodePill>#{r.prospectCode}</ProspectCodePill>
                  )}
                </ReplyResultMeta>
              </ReplyResultRow>
            ))}
          </InboxResultsBox>
        )}
      </InboxPanel>

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
            const isQuickSending = quickSendingId === vendor.id;
            const isContacted = vendor.status === 'contacted';

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
                  <ActionRow>
                    <DraftButton
                      onClick={() => handleDraftPreview(vendor)}
                      disabled={isDrafting || isQuickSending}
                    >
                      {isDrafting ? 'Drafting...' : 'Preview Draft'}
                    </DraftButton>
                    {isContacted ? (
                      <SentBadge>✓ Sent</SentBadge>
                    ) : vendor.email ? (
                      <CampaignButton
                        onClick={() => handleQuickSend(vendor)}
                        disabled={isQuickSending || isDrafting}
                        $active
                      >
                        {isQuickSending ? 'Sending...' : 'Send Email'}
                      </CampaignButton>
                    ) : (
                      <CampaignButton disabled $active={false}>
                        No Email
                      </CampaignButton>
                    )}
                  </ActionRow>
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
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

const GmailBadge = styled.span<{ $connected: boolean }>`
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

const Title = styled.h1`
  font-size: 2rem;
  color: ${p => p.theme.text};
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: ${p => p.theme.textSecondary};
  font-size: 1rem;
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

const DemoToggleRow = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${p => p.theme.border};
`;

const DemoToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${p => p.theme.text};
  cursor: pointer;
`;

const DemoToggleInput = styled.input`
  width: 16px;
  height: 16px;
  accent-color: ${p => p.theme.accent};
  cursor: pointer;
`;

const DemoToggleHint = styled.span`
  color: ${p => p.theme.textMuted};
  font-weight: 400;
`;

const InboxPanel = styled.div`
  background: ${p => p.theme.surface};
  border: 1px solid ${p => p.theme.border};
  border-radius: ${p => p.theme.borderRadius};
  padding: 14px 18px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InboxTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const InboxTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${p => p.theme.textMuted};
`;

const InboxActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const InboxButton = styled.button<{ $primary?: boolean }>`
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid ${p => p.$primary ? p.theme.accent : p.theme.border};
  background: ${p => p.$primary ? p.theme.accent : 'transparent'};
  color: ${p => p.$primary ? 'white' : p.theme.text};
  transition: background 0.15s, opacity 0.15s;

  &:hover:not(:disabled) {
    background: ${p => p.$primary ? p.theme.accentHover : p.theme.surfaceHover};
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const InboxResultsBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
`;

const InboxStat = styled.div`
  font-size: 0.83rem;
  color: ${p => p.theme.textSecondary};
`;

const intentColor = (intent: string, theme: { success: string; danger: string; warning: string; textMuted: string }) => {
  if (intent === 'interested') return theme.success;
  if (intent === 'not_interested') return theme.danger;
  if (intent === 'needs_follow_up') return theme.warning;
  return theme.textMuted;
};

const ReplyResultRow = styled.div<{ $intent: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 7px 10px;
  border-radius: 8px;
  background: ${p => p.theme.backgroundAlt};
  border-left: 3px solid ${p => intentColor(p.$intent, p.theme)};
`;

const ReplyResultName = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${p => p.theme.text};
`;

const IntentBadge = styled.span<{ $intent: string }>`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 20px;
  color: ${p => intentColor(p.$intent, p.theme)};
  background: ${p => `${intentColor(p.$intent, p.theme)}18`};
  border: 1px solid ${p => `${intentColor(p.$intent, p.theme)}40`};
`;

const ReplyResultSummary = styled.span`
  font-size: 0.8rem;
  color: ${p => p.theme.textSecondary};
  flex: 1;
  min-width: 0;
`;

const ReplyResultMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const AutoReplyBadge = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${p => p.theme.success};
  background: ${p => `${p.theme.success}18`};
  border: 1px solid ${p => `${p.theme.success}40`};
  padding: 2px 8px;
  border-radius: 20px;
`;

const ProspectCodePill = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Space Grotesk', monospace;
  color: ${p => p.theme.accent};
  background: ${p => p.theme.accentMuted};
  padding: 2px 10px;
  border-radius: 20px;
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

const CampaignButton = styled.button<{ $active?: boolean }>`
  flex: 1;
  padding: 10px;
  border-radius: ${p => p.theme.borderRadius};
  font-size: 0.85rem;
  font-weight: 600;
  background: ${p => p.$active ? '#10B981' : p.theme.border};
  color: ${p => p.$active ? 'white' : p.theme.textMuted};
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  transition: background 0.15s ease, opacity 0.15s ease;
  opacity: ${p => p.disabled ? 0.6 : 1};

  &:hover:not(:disabled) {
    background: ${p => p.$active ? '#059669' : p.theme.border};
  }
`;

const SentBadge = styled.div`
  flex: 1;
  padding: 10px;
  border-radius: ${p => p.theme.borderRadius};
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
  border: 1px solid rgba(16, 185, 129, 0.25);
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

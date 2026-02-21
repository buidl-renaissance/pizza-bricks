import { getCampaign, updateCampaign, insertCampaignEvent, getCampaignEventByCampaignId } from '@/db/campaigns';
import { insertActivityEvent } from '@/db/ops';

const RENAISSANCE_EVENTS_API_URL = process.env.RENAISSANCE_EVENTS_API_URL || 'http://localhost:3002';
const PIZZA_BRICKS_PUBLIC_URL = process.env.NEXT_PUBLIC_BASE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || 'http://localhost:3000';

async function ensurePizzaBricksPublisher(): Promise<void> {
  const res = await fetch(`${RENAISSANCE_EVENTS_API_URL}/api/publishers`);
  if (!res.ok) return;
  const publishers = await res.json();
  if (Array.isArray(publishers) && publishers.some((p: { slug: string }) => p.slug === 'pizza-bricks')) {
    return;
  }
  await fetch(`${RENAISSANCE_EVENTS_API_URL}/api/publishers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Pizza Bricks',
      slug: 'pizza-bricks',
      description: 'Food vendor growth ops and campaign orchestrator',
    }),
  });
}

export type CampaignActivateResult = {
  success: true;
  campaignId: string;
  publishedEventId: number;
  rsvpUrl: string;
};

/**
 * Run the campaign activation flow: ensure publisher, create event in renaissance-events,
 * insert campaign event, update campaign status, log activity. Used by both ops and vendor endpoints.
 */
export async function runCampaignActivate(campaignId: string): Promise<CampaignActivateResult> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  if (campaign.status !== 'suggested') {
    throw new Error(`Campaign status is ${campaign.status}, cannot activate`);
  }

  await ensurePizzaBricksPublisher();

  const suggestedDate = campaign.suggestedDate ?? new Date().toISOString().slice(0, 10);
  const [datePart] = suggestedDate.split('T');
  const startTime = new Date(`${datePart}T18:00:00`);
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

  const eventData = {
    name: campaign.name,
    location: 'TBD',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    imageUrl: '',
    description: campaign.description ?? campaign.name,
    metadata: { campaignId: campaign.id, source: 'pizza-bricks' },
    tags: ['food', 'community', 'pizza-bricks'],
    eventType: 'renaissance' as const,
    source: 'pizza-bricks',
    sourceId: campaign.id,
    sourceUrl: `${PIZZA_BRICKS_PUBLIC_URL}/ops?tab=campaigns-events`,
  };

  const createRes = await fetch(`${RENAISSANCE_EVENTS_API_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to publish event to renaissance-events');
  }

  const publishedEvent = await createRes.json();
  const publishedEventId = publishedEvent.id;

  const rsvpUrl = `${PIZZA_BRICKS_PUBLIC_URL}/campaigns/rsvp/${campaign.id}`;

  const existingEvent = await getCampaignEventByCampaignId(campaign.id);
  if (!existingEvent) {
    await insertCampaignEvent({
      campaignId: campaign.id,
      publishedEventId,
      rsvpUrl,
      sourceId: campaign.id,
      sourceUrl: `${PIZZA_BRICKS_PUBLIC_URL}/ops?tab=campaigns-events`,
    });
  }

  await updateCampaign(campaign.id, { status: 'active' });

  await insertActivityEvent({
    type: 'campaign_activated',
    targetLabel: campaign.name,
    detail: `Activated campaign: ${campaign.name}`,
    status: 'completed',
    triggeredBy: 'manual',
    metadata: { campaignId: campaign.id, publishedEventId },
  });

  return {
    success: true,
    campaignId: campaign.id,
    publishedEventId,
    rsvpUrl,
  };
}

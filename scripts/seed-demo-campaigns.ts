/**
 * Seed script: campaigns, upcoming events (campaign_events), and creator outreach
 * (campaign_contributor_invites, campaign_outreach).
 * Run after seed-demo and seed-demo-contributors: yarn seed-demo-campaigns
 */
import { config } from 'dotenv';
config({ path: '.env' });

import { getDb } from '../src/db/drizzle';
import {
  campaigns,
  campaignEvents,
  campaignContributorInvites,
  campaignOutreach,
  vendors,
  contributors,
} from '../src/db/schema';
import { and, eq, like } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

async function main() {
  const db = getDb();

  // Resolve demo vendors (from seed-demo-vendors)
  const demoVendors = await db
    .select({ id: vendors.id, name: vendors.name })
    .from(vendors)
    .where(like(vendors.googlePlaceId, 'demo_%'));

  // Resolve seed contributors (from seed-demo-contributors)
  const seedContributors = await db
    .select({ id: contributors.id, name: contributors.name, email: contributors.email, instagramHandle: contributors.instagramHandle })
    .from(contributors)
    .where(like(contributors.email, 'creator-%'))
    .limit(30);

  const vendorIds = demoVendors.map((v) => v.id);
  const contributorIds = seedContributors.map((c) => c.id);

  if (vendorIds.length === 0) {
    console.log('No demo vendors found. Run yarn seed-demo first.');
  }
  if (contributorIds.length === 0) {
    console.log('No seed contributors found. Run yarn seed-demo-contributors first.');
  }

  let campaignsInserted = 0;
  let eventsInserted = 0;
  let invitesInserted = 0;
  let outreachInserted = 0;

  // ── Campaigns ─────────────────────────────────────────────────────────────
  const DEMO_CAMPAIGNS = [
    {
      name: 'Mia\'s Cocinita Taco Tuesday',
      type: 'community_event' as const,
      status: 'active' as const,
      description: 'Weekly Taco Tuesday pop-up with live music and local creators.',
      suggestedDate: '2025-03-04',
      suggestedTime: '5:00 PM – 9:00 PM',
      estimatedCost: 15000, // cents
      estimatedReach: 500,
      requiredContributors: 3,
      vendorIndex: 0,
    },
    {
      name: 'Skylar\'s Southern Kitchen Photographer Night',
      type: 'contributor_driven' as const,
      status: 'suggested' as const,
      description: 'Invite local food photographers to capture the new spring menu.',
      suggestedDate: '2025-03-15',
      suggestedTime: '6:00 PM',
      estimatedCost: 8000,
      estimatedReach: 2000,
      requiredContributors: 5,
      vendorIndex: 1,
    },
    {
      name: 'La Sabrosita 1K Follower Unlock',
      type: 'growth_milestone' as const,
      status: 'suggested' as const,
      description: 'Celebrate hitting 1K Instagram followers with a one-day special and creator collab.',
      suggestedDate: '2025-03-22',
      suggestedTime: '11:00 AM – 3:00 PM',
      estimatedCost: 12000,
      estimatedReach: 1500,
      requiredContributors: 2,
      vendorIndex: 5,
    },
    {
      name: 'Taquitos Jalisco Referral Rally',
      type: 'referral_rally' as const,
      status: 'active' as const,
      description: 'Ambassador referral links; top referrers get free meal and feature.',
      suggestedDate: '2025-03-01',
      suggestedTime: 'All day',
      estimatedCost: 5000,
      estimatedReach: 800,
      requiredContributors: 10,
      vendorIndex: 2,
    },
    {
      name: 'Don Sabroson Weekend Pop-up',
      type: 'community_event' as const,
      status: 'suggested' as const,
      description: 'Weekend pop-up with pupusa specials and influencer tastings.',
      suggestedDate: '2025-04-05',
      suggestedTime: '12:00 PM – 6:00 PM',
      estimatedCost: 10000,
      estimatedReach: 400,
      requiredContributors: 2,
      vendorIndex: 3,
    },
  ];

  const insertedCampaignIds: string[] = [];

  for (const c of DEMO_CAMPAIGNS) {
    const existing = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.name, c.name))
      .then((r) => r[0] ?? null);

    if (existing) {
      insertedCampaignIds.push(existing.id);
      continue;
    }

    const vendorId = vendorIds[c.vendorIndex] ?? null;
    const id = uuid();
    await db.insert(campaigns).values({
      id,
      vendorId,
      prospectId: null,
      type: c.type,
      status: c.status,
      name: c.name,
      description: c.description,
      suggestedDate: c.suggestedDate,
      suggestedTime: c.suggestedTime,
      estimatedCost: c.estimatedCost,
      estimatedReach: c.estimatedReach,
      requiredContributors: c.requiredContributors,
      budget: c.estimatedCost ? Math.round(c.estimatedCost * 1.2) : null,
    });
    insertedCampaignIds.push(id);
    campaignsInserted++;
    console.log(`✓ Campaign: ${c.name}`);
  }

  // ── Campaign events (upcoming events) ───────────────────────────────────────
  const campaignIdForEvents = insertedCampaignIds[0] ?? null;
  if (campaignIdForEvents) {
    const existingEvent = await db
      .select()
      .from(campaignEvents)
      .where(eq(campaignEvents.campaignId, campaignIdForEvents))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!existingEvent) {
      await db.insert(campaignEvents).values({
        id: uuid(),
        campaignId: campaignIdForEvents,
        publishedEventId: null,
        rsvpUrl: null,
        qrImageUrl: null,
        sourceId: null,
        sourceUrl: null,
        metadata: JSON.stringify({ source: 'seed' }),
      });
      eventsInserted++;
      console.log('✓ Campaign event (upcoming): linked to first campaign');
    }

    if (insertedCampaignIds[1]) {
      const existingEvent2 = await db
        .select()
        .from(campaignEvents)
        .where(eq(campaignEvents.campaignId, insertedCampaignIds[1]))
        .limit(1)
        .then((r) => r[0] ?? null);
      if (!existingEvent2) {
        await db.insert(campaignEvents).values({
          id: uuid(),
          campaignId: insertedCampaignIds[1],
          metadata: JSON.stringify({ source: 'seed' }),
        });
        eventsInserted++;
      }
    }
  }

  // ── Creator invites (campaign_contributor_invites) ──────────────────────────
  const inviteStatuses = ['pending', 'accepted', 'declined'] as const;
  for (let i = 0; i < Math.min(insertedCampaignIds.length, 3); i++) {
    const campaignId = insertedCampaignIds[i];
    for (let j = 0; j < Math.min(contributorIds.length, 4); j++) {
      const contributorId = contributorIds[j];
      const existing = await db
        .select()
        .from(campaignContributorInvites)
        .where(
          and(
            eq(campaignContributorInvites.campaignId, campaignId),
            eq(campaignContributorInvites.contributorId, contributorId)
          )
        )
        .limit(1)
        .then((r) => r[0] ?? null);

      if (existing) continue;

      await db.insert(campaignContributorInvites).values({
        id: uuid(),
        campaignId,
        contributorId,
        role: j % 2 === 0 ? 'photographer' : 'influencer',
        status: inviteStatuses[j % 3],
        invitedAt: j % 3 !== 0 ? new Date() : null,
        respondedAt: j % 3 === 1 ? new Date() : null,
      });
      invitesInserted++;
    }
  }
  if (invitesInserted > 0) console.log(`✓ Creator invites: ${invitesInserted} inserted`);

  // ── Creator outreach (campaign_outreach) ───────────────────────────────────
  const statuses = ['draft', 'sent'] as const;
  for (let i = 0; i < Math.min(insertedCampaignIds.length, 2); i++) {
    const campaignId = insertedCampaignIds[i];
    for (let j = 0; j < Math.min(seedContributors.length, 3); j++) {
      const contributor = seedContributors[j];
      const recipientVal = contributor.email ?? contributor.instagramHandle ?? `creator-${j}@example.com`;
      const existing = await db
        .select()
        .from(campaignOutreach)
        .where(
          and(
            eq(campaignOutreach.campaignId, campaignId),
            eq(campaignOutreach.recipient, recipientVal)
          )
        )
        .limit(1)
        .then((r) => r[0] ?? null);

      if (existing) continue;

      const channel = contributor.email ? 'email' : 'dm';
      await db.insert(campaignOutreach).values({
        id: uuid(),
        campaignId,
        contributorId: contributor.id,
        channel,
        recipient: recipientVal,
        status: statuses[j % 2],
        subject: channel === 'email' ? `Invitation: campaign collaboration` : null,
        bodyHtml: channel === 'email' ? `<p>Hi ${contributor.name}, we'd love to have you join this campaign.</p>` : null,
        bodyText: channel === 'email' ? `Hi ${contributor.name}, we'd love to have you join.` : null,
        sentAt: j % 2 === 1 ? new Date() : null,
        metadata: JSON.stringify({ source: 'seed' }),
      });
      outreachInserted++;
    }
  }
  if (outreachInserted > 0) console.log(`✓ Creator outreach: ${outreachInserted} inserted`);

  console.log(
    `\nDone — campaigns: ${campaignsInserted}, events: ${eventsInserted}, invites: ${invitesInserted}, outreach: ${outreachInserted} (seed-demo-campaigns).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

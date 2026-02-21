import Anthropic from '@anthropic-ai/sdk';
import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendors, prospects } from '@/db/schema';
import { insertCampaign, getContributorCountsByRole } from '@/db/campaigns';
import { insertActivityEvent } from '@/db/ops';
import type { CampaignType } from '@/db/schema';
import { recordAgenticCost, estimateCostUsd } from '@/lib/agentic-cost';

const SYSTEM_PROMPT = `You are a campaign orchestration assistant for local food vendors (pizza trucks, taco stands, coffee shops, etc.). You suggest campaign ideas that drive foot traffic, awareness, and community goodwill.

Your suggestions should be grounded in:
1. Brand type (pizza, taco, coffee, etc.) and growth stage (kitchen / truck / storefront)
2. Location and city
3. Contributor network (photographers, influencers, repeat customers, referral leaders)
4. Seasonality (current month, local events)
5. Budget constraints (optional)

Campaign types:
- community_event: Pizza Party, Neighborhood Appreciation Night (foot traffic, RSVP, slice discount)
- contributor_driven: Photographer Night, Creator Slice Night, Influencer Tasting
- growth_milestone: 1000 Followers Unlock, Truck to Brick Celebration, New Menu Drop
- referral_rally: Referral links, tiered rewards, ambassador competition

If the contributor network has photographers or influencers who have never been invited to a campaign, highlight this as an "underutilization insight" — e.g. "12 photographers in network, 5 influencers in area—Host a Creator Slice Night"

Return exactly one campaign suggestion using the suggest_campaign tool.`;

const SUGGEST_CAMPAIGN_SCHEMA = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['community_event', 'contributor_driven', 'growth_milestone', 'referral_rally'],
      description: 'Campaign type',
    },
    name: { type: 'string', description: 'Campaign name (e.g. Eastern Market Late Night Slice Rally)' },
    description: { type: 'string', description: 'Short description' },
    suggestedDate: { type: 'string', description: 'Suggested date as YYYY-MM-DD' },
    suggestedTime: { type: 'string', description: 'Suggested time window (e.g. 6pm-8pm)' },
    estimatedCost: { type: 'number', description: 'Estimated cost in cents' },
    estimatedReach: { type: 'number', description: 'Estimated reach (attendees)' },
    requiredContributors: { type: 'number', description: 'Number of contributors needed' },
    budget: { type: 'number', description: 'Recommended budget in cents' },
    assetList: {
      type: 'array',
      items: { type: 'string' },
      description: 'Asset list: poster, ig_post, rsvp_page, qr_image, etc.',
    },
    underutilizationInsight: {
      type: 'string',
      description: 'Optional insight like "12 photographers, 5 influencers—Host Creator Slice Night"',
    },
    timeline: {
      type: 'string',
      description: 'JSON string: { days: number, phases: string[] }',
    },
  },
  required: ['type', 'name', 'description'],
} satisfies Tool['input_schema'];

export interface SuggestCampaignInput {
  vendorId?: string;
  prospectId?: string;
  budgetHint?: number; // cents
  city?: string;
}

export interface SuggestCampaignResult {
  campaignId: string;
  name: string;
  type: CampaignType;
}

async function getVendors(limit = 20) {
  const db = getDb();
  return db.select().from(vendors).limit(limit);
}

async function getProspects(limit = 20) {
  const db = getDb();
  return db.select().from(prospects).orderBy(desc(prospects.lastActivityAt)).limit(limit);
}

export async function runSuggestCampaign(input: SuggestCampaignInput = {}): Promise<SuggestCampaignResult> {
  const { vendorId, prospectId, budgetHint, city } = input;
  const db = getDb();

  let vendorContext = '';
  let prospectContext = '';
  let primaryCity = city ?? 'Detroit';
  let primaryName = 'Local food vendor';

  if (vendorId) {
    const vendorRows = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
    const vendor = vendorRows[0];
    if (vendor) {
      const cats = vendor.categories ? JSON.parse(vendor.categories as string) as string[] : [];
      const addrParts = vendor.address?.split(',').map(s => s.trim()) || [];
      const vCity = addrParts.length >= 2 ? addrParts[addrParts.length - 2] : 'Detroit';
      primaryCity = vCity;
      primaryName = vendor.name;
      vendorContext = `Vendor: ${vendor.name}, address: ${vendor.address ?? 'N/A'}, city: ${primaryCity}, categories: ${cats.join(', ') || 'food'}, instagram: ${vendor.instagramUrl ?? 'N/A'}`;
    }
  } else {
    const vendorsList = await getVendors(5);
    if (vendorsList.length > 0) {
      const v = vendorsList[0];
      const cats = v.categories ? JSON.parse(v.categories as string) as string[] : [];
      const addrParts = v.address?.split(',').map(s => s.trim()) || [];
      primaryCity = addrParts.length >= 2 ? addrParts[addrParts.length - 2] : 'Detroit';
      primaryName = v.name;
      vendorContext = `Sample vendor: ${v.name}, city: ${primaryCity}, categories: ${cats.join(', ') || 'food'}. Also ${vendorsList.length - 1} other vendors in the system.`;
    }
  }

  if (prospectId) {
    const prospectRows = await db.select().from(prospects).where(eq(prospects.id, prospectId)).limit(1);
    const prospect = prospectRows[0];
    if (prospect) {
      primaryCity = prospect.city ?? primaryCity;
      primaryName = prospect.name;
      prospectContext = `Prospect: ${prospect.name}, type: ${prospect.type}, city: ${prospect.city ?? 'N/A'}`;
    }
  } else if (!vendorContext) {
    const prospectList = await getProspects(3);
    if (prospectList.length > 0) {
      const p = prospectList[0];
      primaryCity = p.city ?? primaryCity;
      primaryName = p.name;
      prospectContext = `Sample prospect: ${p.name}, type: ${p.type}, city: ${p.city ?? 'N/A'}`;
    }
  }

  const contributorCounts = await getContributorCountsByRole(vendorId ?? undefined, prospectId ?? undefined);
  const totalContributors = Object.values(contributorCounts).reduce((a, b) => a + b, 0);
  const contributorContext = totalContributors > 0
    ? `Contributor network: ${contributorCounts.photographer} photographers, ${contributorCounts.influencer} influencers, ${contributorCounts.ambassador} ambassadors, ${contributorCounts.repeat_customer} repeat customers, ${contributorCounts.referral_leader} referral leaders.`
    : 'No contributors in network yet. Suggest a campaign that can attract contributors (e.g. Creator Slice Night).';

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });

  const userPrompt = `Suggest a campaign for ${primaryName} in ${primaryCity}.

${vendorContext}
${prospectContext}
${contributorContext}

Seasonality: ${monthName} ${now.getFullYear()}.
${budgetHint ? `Budget hint: $${(budgetHint / 100).toFixed(0)}` : 'No budget constraint.'}

Provide one compelling campaign suggestion using the suggest_campaign tool.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [{
      name: 'suggest_campaign',
      description: 'Suggest a campaign for the vendor',
      input_schema: SUGGEST_CAMPAIGN_SCHEMA,
    }],
    tool_choice: { type: 'tool', name: 'suggest_campaign' },
  });

  const toolBlock = response.content.find(b => b.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('suggest_campaign: no tool_use in response');
  }

  const raw = toolBlock.input as Record<string, unknown>;
  const type = (raw.type as CampaignType) ?? 'community_event';
  const name = (raw.name as string) ?? 'Suggested Campaign';
  const description = (raw.description as string) ?? '';

  const model = 'claude-sonnet-4-20250514';
  const inputTokens = response.usage?.input_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;
  const estimatedCostUsd = estimateCostUsd(model, inputTokens, outputTokens);

  const campaign = await insertCampaign({
    vendorId: vendorId ?? undefined,
    prospectId: prospectId ?? undefined,
    type,
    status: 'suggested',
    name,
    description,
    suggestedDate: typeof raw.suggestedDate === 'string' ? raw.suggestedDate : undefined,
    suggestedTime: typeof raw.suggestedTime === 'string' ? raw.suggestedTime : undefined,
    estimatedCost: typeof raw.estimatedCost === 'number' ? raw.estimatedCost : undefined,
    estimatedReach: typeof raw.estimatedReach === 'number' ? raw.estimatedReach : undefined,
    requiredContributors: typeof raw.requiredContributors === 'number' ? raw.requiredContributors : undefined,
    budget: typeof raw.budget === 'number' ? raw.budget : budgetHint,
    assetList: Array.isArray(raw.assetList) ? (raw.assetList as string[]) : undefined,
    underutilizationInsight: typeof raw.underutilizationInsight === 'string' ? raw.underutilizationInsight : undefined,
    timeline: typeof raw.timeline === 'string' ? raw.timeline : undefined,
    inputTokens,
    outputTokens,
    estimatedCostUsd,
  });

  if (inputTokens > 0 || outputTokens > 0) {
    await recordAgenticCost({
      operation: 'campaign_suggestion',
      entityType: 'campaign',
      entityId: campaign.id,
      model,
      inputTokens,
      outputTokens,
    });
  }

  await insertActivityEvent({
    type: 'campaign_suggested',
    prospectId: prospectId ?? undefined,
    targetLabel: name,
    detail: `Suggested campaign: ${name}`,
    status: 'completed',
    triggeredBy: 'agent',
    metadata: { campaignId: campaign.id, type },
  });

  return { campaignId: campaign.id, name: campaign.name, type };
}

import Anthropic from '@anthropic-ai/sdk';
import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';
import { BrandBrief, BrandBriefSchema } from './brand-brief';

const SYSTEM_PROMPT = `You are a brand intelligence assistant. Extract all available business information from the provided text document and return it as structured data using the extract_brand_brief tool.

Fill in every field you can find. For missing information, apply these sensible defaults:
- vendorType: infer from context (home_caterer for home-based operations, food_truck for mobile, brick_and_mortar for physical storefronts). Default to "home_caterer" if unclear.
- primaryColor: "#C41E3A" (classic red) if no colors are mentioned
- accentColor: "#2D1B00" (deep warm brown) if no accent color is mentioned
- tagline: create a concise, memorable tagline (max 8 words) from the business description
- voice: describe the brand voice in 3-5 words, inferred from tone and business type (e.g. "warm, homey, authentic")
- stage: "established" unless the text suggests otherwise

Extract ALL menu items with their prices. Include social media handles if mentioned.`;

const BRAND_BRIEF_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    business: {
      type: 'object',
      description: 'Core business information',
      properties: {
        name: { type: 'string', description: 'Business name' },
        vendorType: {
          type: 'string',
          enum: ['home_caterer', 'food_truck', 'brick_and_mortar'],
          description: 'Type of food vendor',
        },
        city: { type: 'string', description: 'City where the business operates' },
        phone: { type: 'string', description: 'Contact phone number' },
        email: { type: 'string', description: 'Contact email address' },
        hours: { type: 'string', description: 'Operating hours' },
        stage: { type: 'string', description: 'Business stage' },
      },
      required: ['name', 'vendorType', 'city'],
    },
    brand: {
      type: 'object',
      description: 'Brand identity',
      properties: {
        primaryColor: { type: 'string', description: 'Primary color as hex, e.g. #C41E3A' },
        accentColor: { type: 'string', description: 'Accent color as hex' },
        tagline: { type: 'string', description: 'Short marketing tagline' },
        voice: { type: 'string', description: 'Brand voice description' },
      },
      required: ['primaryColor', 'accentColor', 'tagline', 'voice'],
    },
    menu: {
      type: 'array',
      description: 'Menu items',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['name', 'price'],
      },
    },
    media: {
      type: 'object',
      description: 'Media asset URLs',
      properties: {
        logo: { type: 'string' },
        hero: { type: 'string' },
        gallery: { type: 'array', items: { type: 'string' } },
      },
    },
    social: {
      type: 'object',
      description: 'Social media handles',
      properties: {
        instagram: { type: 'string' },
        facebook: { type: 'string' },
        twitter: { type: 'string' },
        tiktok: { type: 'string' },
      },
    },
    reviews: {
      type: 'array',
      description: 'Customer reviews',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          author: { type: 'string' },
          rating: { type: 'number', minimum: 1, maximum: 5 },
        },
        required: ['text', 'author', 'rating'],
      },
    },
  },
  required: ['business', 'brand', 'menu', 'media'],
} satisfies Tool['input_schema'];

const BRAND_BRIEF_MODEL = 'claude-opus-4-6';

export interface BrandBriefUsage {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens?: number;
  model: string;
}

export async function extractBrandBrief(document: string): Promise<{ brief: BrandBrief; usage: BrandBriefUsage }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: BRAND_BRIEF_MODEL,
    max_tokens: 8096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: document }],
    tools: [
      {
        name: 'extract_brand_brief',
        description:
          'Extract structured brand and business information from the document',
        input_schema: BRAND_BRIEF_INPUT_SCHEMA,
      },
    ],
    tool_choice: { type: 'tool', name: 'extract_brand_brief' },
  });

  const toolBlock = response.content.find((b) => b.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('Brand brief extractor: no tool_use block in response');
  }

  const thinkingTokens = response.usage && 'thinking_tokens' in response.usage ? (response.usage as { thinking_tokens?: number }).thinking_tokens : undefined;
  const usage: BrandBriefUsage = {
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    ...(thinkingTokens != null && thinkingTokens > 0 ? { thinkingTokens } : {}),
    model: BRAND_BRIEF_MODEL,
  };

  return {
    brief: BrandBriefSchema.parse(toolBlock.input),
    usage,
  };
}

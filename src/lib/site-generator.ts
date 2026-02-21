import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { BrandBrief } from './brand-brief';
import type { BiteBiteConfig } from './site-pipeline';
import { buildPrompts } from './prompt-engineer';

const GeneratedFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

const GeneratedSiteSchema = z.object({
  files: z.array(GeneratedFileSchema),
});

export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;
export type GeneratedSite = z.infer<typeof GeneratedSiteSchema>;

function stripMarkdownFences(text: string): string {
  // Strip ```json ... ``` or ``` ... ``` wrappers
  return text
    .replace(/^```(?:json)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim();
}

function parseGeneratedSite(rawText: string): GeneratedSite {
  const cleaned = stripMarkdownFences(rawText);

  // Find the outermost JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('Site generator: no JSON object found in response');
  }

  const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Site generator: failed to parse JSON response — ${e}`);
  }

  return GeneratedSiteSchema.parse(parsed);
}

const SITE_GEN_MODEL = 'claude-opus-4-6';

export interface SiteGenUsage {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens?: number;
  model: string;
}

export async function generateSite(
  brief: BrandBrief,
  biteBiteConfig?: BiteBiteConfig
): Promise<{ site: GeneratedSite; usage: SiteGenUsage }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompts = buildPrompts(brief, biteBiteConfig);

  const stream = client.messages.stream({
    model: SITE_GEN_MODEL,
    max_tokens: 32000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: 'enabled', budget_tokens: 8000 } as any,
    system: prompts.systemPrompt,
    messages: [{ role: 'user', content: prompts.userPrompt }],
  });

  const message = await stream.finalMessage();

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Site generator: no text block in response');
  }

  const usage: SiteGenUsage = {
    inputTokens: message.usage?.input_tokens ?? 0,
    outputTokens: message.usage?.output_tokens ?? 0,
    ...(message.usage?.thinking_tokens != null && message.usage.thinking_tokens > 0
      ? { thinkingTokens: message.usage.thinking_tokens }
      : {}),
    model: SITE_GEN_MODEL,
  };

  return {
    site: parseGeneratedSite(textBlock.text),
    usage,
  };
}

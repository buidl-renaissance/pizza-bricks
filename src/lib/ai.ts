/**
 * AI provider abstraction for email drafting, menu inference, and reply analysis.
 *
 * Switch providers by setting AI_PROVIDER in .env:
 *   AI_PROVIDER=anthropic  → uses Claude (default)
 *   AI_PROVIDER=gemini     → uses Gemini
 *
 * Note: analyzeReplyIntent always uses Anthropic (no Gemini equivalent yet).
 */

const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();

export type { MenuItem, VendorContext, ReplyIntent, ReplyAnalysis } from './anthropic';
export { analyzeReplyIntent } from './anthropic';

export async function inferMenuItems(
  vendor: import('./anthropic').VendorContext
): Promise<import('./anthropic').MenuItem[]> {
  if (provider === 'gemini') {
    const { inferMenuItems: fn } = await import('./gemini');
    return fn(vendor);
  }
  const { inferMenuItems: fn } = await import('./anthropic');
  const result = await fn(vendor);
  return result.menuItems;
}

export async function draftOutreachEmail(
  vendor: import('./anthropic').VendorContext,
  menuItems: import('./anthropic').MenuItem[],
  siteUrl?: string
): Promise<{ subject: string; bodyHtml: string }> {
  if (provider === 'gemini') {
    const { draftOutreachEmail: fn } = await import('./gemini');
    return fn(vendor, menuItems);
  }
  const { draftOutreachEmail: fn } = await import('./anthropic');
  const result = await fn(vendor, menuItems, siteUrl);
  return { subject: result.subject, bodyHtml: result.bodyHtml };
}

import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '@anthropic-ai/sdk/resources/messages/messages';
import { addUsage } from './usage-tracker';

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  return new Anthropic({ apiKey });
}

/** Non-streaming create; returns a Message (never a Stream). */
async function createMessage(
  params: Omit<Parameters<Anthropic['messages']['create']>[0], 'stream'>,
): Promise<Message> {
  const client = getClient();
  const message = await client.messages.create({ ...params, stream: false });
  if ('usage' in message && message.usage) {
    addUsage(message.usage.input_tokens, message.usage.output_tokens);
  }
  return message as Message;
}

export interface MenuItem {
  name: string;
  description: string;
  price?: string;
}

export interface VendorContext {
  name: string;
  address?: string | null;
  phone?: string | null;
  rating?: string | null;
  reviewCount?: number | null;
  categories?: string | null;
  topReviews?: string | null;
  recentPosts?: string | null;
  menuItems?: string | null;
  email?: string | null;
}

export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
  thinking_tokens?: number;
}

export async function inferMenuItems(vendor: VendorContext): Promise<{ menuItems: MenuItem[]; usage?: AnthropicUsage }> {
  const sources: string[] = [];

  if (vendor.topReviews) {
    try {
      const reviews = JSON.parse(vendor.topReviews);
      if (Array.isArray(reviews)) {
        sources.push('GOOGLE REVIEWS:\n' + reviews.map((r: { text: string; authorName: string }) =>
          `- ${r.authorName}: "${r.text}"`
        ).join('\n'));
      }
    } catch { /* skip */ }
  }

  if (vendor.recentPosts) {
    try {
      const snippets = JSON.parse(vendor.recentPosts);
      if (Array.isArray(snippets)) {
        sources.push('WEB SEARCH SNIPPETS ABOUT MENU:\n' + snippets.map((s: { source: string; text: string }) =>
          `- ${s.source}: "${s.text}"`
        ).join('\n'));
      }
    } catch { /* skip */ }
  }

  if (sources.length === 0) return { menuItems: [] };

  const prompt = `You are analyzing data about a food business called "${vendor.name}".
Based on the following information, extract a list of menu items this business likely serves.
For each item, provide the name, a brief description, and a price if mentioned.

${sources.join('\n\n')}

Return ONLY a JSON array with no markdown formatting, no code fences, no explanation.
Each element: { "name": "...", "description": "...", "price": "..." }
If price is unknown, omit the price field.
If you cannot determine any menu items, return an empty array [].`;

  const message = await createMessage({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  if (!('content' in message)) return { menuItems: [] };
  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  const usage = message.usage
    ? {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        thinking_tokens: (message.usage as { thinking_tokens?: number }).thinking_tokens,
      }
    : undefined;

  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return { menuItems: [], usage };
    const menuItems = parsed.filter((item: MenuItem) => item.name && typeof item.name === 'string');
    return { menuItems, usage };
  } catch (err) {
    console.error('Failed to parse Anthropic menu response:', text, err);
    return { menuItems: [], usage };
  }
}

export type ReplyIntent = 'interested' | 'not_interested' | 'needs_follow_up' | 'unclear';

export interface ReplyAnalysis {
  intent: ReplyIntent;
  confidence: number;   // 0–1
  summary: string;      // one sentence
}

export async function analyzeReplyIntent(
  vendorName: string,
  replyText: string
): Promise<ReplyAnalysis> {
  const prompt = `You are analyzing an email reply from a local food vendor ("${vendorName}") to an outreach email from Pizza Bricks, a service offering to build them a free website and help grow their business.

VENDOR REPLY:
"""
${replyText.slice(0, 2000)}
"""

Classify the vendor's intent. Return ONLY a JSON object — no markdown, no explanation:
{
  "intent": "interested" | "not_interested" | "needs_follow_up" | "unclear",
  "confidence": <0.0–1.0>,
  "summary": "<one sentence explaining the classification>"
}

Intent definitions:
- "interested": vendor clearly wants to proceed, asks questions, or says yes
- "not_interested": vendor explicitly declines or says they don't need help
- "needs_follow_up": vendor is on the fence, asks for more info, or gives a partial response
- "unclear": auto-reply, spam, or impossible to determine intent`;

  const message = await createMessage({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';

  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      intent: parsed.intent as ReplyIntent,
      confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0)),
      summary: parsed.summary || '',
    };
  } catch (err) {
    console.error('Failed to parse reply intent response:', text, err);
    return { intent: 'unclear', confidence: 0, summary: 'Could not parse AI response.' };
  }
}

export async function draftOutreachEmail(
  vendor: VendorContext,
  menuItems: MenuItem[],
  _siteUrl?: string
): Promise<{ subject: string; bodyHtml: string; usage?: AnthropicUsage }> {
  let categories: string[] = [];
  try {
    if (vendor.categories) categories = JSON.parse(vendor.categories);
  } catch { /* skip */ }

  let reviewSnippets = '';
  try {
    if (vendor.topReviews) {
      const reviews = JSON.parse(vendor.topReviews);
      if (Array.isArray(reviews) && reviews.length > 0) {
        reviewSnippets = reviews.slice(0, 3).map((r: { text: string; authorName: string; rating: number }) =>
          `"${r.text.slice(0, 120)}..." — ${r.authorName} (${r.rating} stars)`
        ).join('\n');
      }
    }
  } catch { /* skip */ }

  const menuList = menuItems.length > 0
    ? menuItems.slice(0, 8).map(m => `- ${m.name}${m.price ? ` ($${m.price})` : ''}: ${m.description}`).join('\n')
    : 'No menu items found';

  const hasWebsite = !!(vendor as { websiteUrl?: string | null }).websiteUrl;

  const prompt = `You are writing a warm, professional outreach email on behalf of Pizza Bricks — a service that helps local food vendors grow their business through websites, marketing, and payment systems.

BUSINESS INFO:
- Name: ${vendor.name}
- Address: ${vendor.address || 'Unknown'}
- Phone: ${vendor.phone || 'Unknown'}
- Rating: ${vendor.rating || 'N/A'}/5 (${vendor.reviewCount || 0} reviews)
- Type: ${categories.map(c => c.replace(/_/g, ' ')).join(', ') || 'Food vendor'}
- Website: ${hasWebsite ? 'Has a website' : 'No website'}

CUSTOMER REVIEWS:
${reviewSnippets || 'No reviews available'}

MENU ITEMS:
${menuList}

GUIDELINES:
- The email should be friendly, not salesy or pushy
- Reference specific details: mention a popular dish, a positive review, or their rating
- ${hasWebsite
    ? 'They have a website but we can help improve it — mention we can build a better, modern version for free'
    : 'Explain that we noticed they don\'t have a website and we\'d love to help'}
- Mention we can build them a sample website for free to see if they like it
- Keep it concise — 3-4 short paragraphs max
- Sign off as "The Pizza Bricks Team"
- Do NOT include any placeholder brackets like [Name] — use the actual business name
- The subject line must use only plain ASCII characters — no em dashes, smart quotes, or special punctuation

Return ONLY a JSON object with no markdown formatting, no code fences:
{ "subject": "...", "bodyHtml": "..." }

The bodyHtml should be simple HTML (p tags, br, b/em for emphasis). No inline styles or complex markup.`;

  const message = await createMessage({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  const usage = message.usage
    ? {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        thinking_tokens: (message.usage as { thinking_tokens?: number }).thinking_tokens,
      }
    : undefined;

  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      subject: parsed.subject || `We'd love to help ${vendor.name} grow online`,
      bodyHtml: parsed.bodyHtml || '<p>Could not generate email body.</p>',
      usage,
    };
  } catch (err) {
    console.error('Failed to parse Anthropic email response:', text, err);
    return {
      subject: `We'd love to help ${vendor.name} grow online`,
      bodyHtml: '<p>Could not generate email body. Please try again.</p>',
      usage,
    };
  }
}

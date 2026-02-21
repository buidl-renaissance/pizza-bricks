import { GoogleGenerativeAI } from '@google/generative-ai';

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export interface MenuItem {
  name: string;
  description: string;
  price?: string;
}

export interface DraftEmailResult {
  subject: string;
  bodyHtml: string;
  menuItems: MenuItem[];
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

export async function inferMenuItems(vendor: VendorContext): Promise<MenuItem[]> {
  const model = getModel();

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

  if (sources.length === 0) return [];

  const prompt = `You are analyzing data about a food business called "${vendor.name}".
Based on the following information, extract a list of menu items this business likely serves.
For each item, provide the name, a brief description, and a price if mentioned.

${sources.join('\n\n')}

Return ONLY a JSON array with no markdown formatting, no code fences, no explanation.
Each element: { "name": "...", "description": "...", "price": "..." }
If price is unknown, omit the price field.
If you cannot determine any menu items, return an empty array [].`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item: MenuItem) => item.name && typeof item.name === 'string');
  } catch (err) {
    console.error('Failed to parse Gemini menu response:', text, err);
    return [];
  }
}

export async function draftOutreachEmail(
  vendor: VendorContext,
  menuItems: MenuItem[],
  siteUrl?: string
): Promise<{ subject: string; bodyHtml: string }> {
  const model = getModel();

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

  const prompt = `You are writing a warm, professional outreach email on behalf of Pizza Bricks — a service that helps local food vendors grow their business through websites, marketing, and payment systems.

BUSINESS INFO:
- Name: ${vendor.name}
- Address: ${vendor.address || 'Unknown'}
- Phone: ${vendor.phone || 'Unknown'}
- Rating: ${vendor.rating || 'N/A'}/5 (${vendor.reviewCount || 0} reviews)
- Type: ${categories.map(c => c.replace(/_/g, ' ')).join(', ') || 'Food vendor'}
- Currently has NO website

CUSTOMER REVIEWS:
${reviewSnippets || 'No reviews available'}

MENU ITEMS:
${menuList}

GUIDELINES:
- The email should be friendly, not salesy or pushy
- Reference specific details: mention a popular dish, a positive review, or their rating
- Explain that we noticed they don't have a website and we'd love to help
${siteUrl
  ? `- IMPORTANT: We have already built a sample site for them. Include this exact link in the email: ${siteUrl}. Say we've built a sample site and invite them to click the link to see it.`
  : '- Mention we can build them a sample website for free to see if they like it'}
- Keep it concise — 3-4 short paragraphs max
- Sign off as "The Pizza Bricks Team"
- Do NOT include any placeholder brackets like [Name] — use the actual business name

Return ONLY a JSON object with no markdown formatting, no code fences:
{ "subject": "...", "bodyHtml": "..." }

The bodyHtml should be simple HTML (p tags, br, b/em for emphasis). No inline styles or complex markup.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      subject: parsed.subject || `We'd love to help ${vendor.name} grow online`,
      bodyHtml: parsed.bodyHtml || '<p>Could not generate email body.</p>',
    };
  } catch (err) {
    console.error('Failed to parse Gemini email response:', text, err);
    return {
      subject: `We'd love to help ${vendor.name} grow online`,
      bodyHtml: '<p>Could not generate email body. Please try again.</p>',
    };
  }
}

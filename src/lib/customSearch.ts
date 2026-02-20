const SERPER_URL = 'https://google.serper.dev/search';

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
}

interface SerperResponse {
  organic?: SerperResult[];
  knowledgeGraph?: {
    title?: string;
    description?: string;
    attributes?: Record<string, string>;
  };
}

async function serperSearch(query: string): Promise<SerperResponse> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.error('SERPER_API_KEY is not set');
    return {};
  }

  const res = await fetch(SERPER_URL, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 10 }),
  });

  if (!res.ok) {
    console.error('Serper search failed:', res.status, await res.text());
    return {};
  }

  return res.json();
}

const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'aol.com', 'icloud.com', 'protonmail.com', 'proton.me',
  'live.com', 'msn.com', 'mail.com', 'ymail.com',
  'comcast.net', 'att.net', 'verizon.net', 'sbcglobal.net',
  'me.com', 'mac.com', 'zoho.com',
];

function isLikelyBusinessEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return PERSONAL_EMAIL_DOMAINS.some(d => domain === d);
}

const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.]+/g;

/**
 * Normalize a business name into lowercase alpha tokens for fuzzy matching.
 * e.g. "Mía Cocinita" -> ["mia", "cocinita"]
 */
function nameTokens(name: string): string[] {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length >= 3); // skip tiny words like "el", "la", "de"
}

/**
 * Check if an email's local part (before @) shares significant overlap with the business name.
 * e.g. "miacocinita7@gmail.com" matches "Mía Cocinita" because "miacocinita" contains "mia" + "cocinita".
 */
function emailMatchesBusinessName(email: string, businessName: string): boolean {
  const localPart = email.split('@')[0]?.toLowerCase().replace(/[^a-z]/g, '') || '';
  const tokens = nameTokens(businessName);
  if (tokens.length === 0) return false;
  const matchCount = tokens.filter(t => localPart.includes(t)).length;
  return matchCount >= Math.max(1, Math.ceil(tokens.length * 0.5));
}

/**
 * Check if a search result (title + snippet) is clearly about the target business,
 * not a community page listing multiple businesses.
 */
function resultIsAboutBusiness(item: SerperResult, businessName: string): boolean {
  const tokens = nameTokens(businessName);
  if (tokens.length === 0) return false;
  const titleLower = item.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const matchCount = tokens.filter(t => titleLower.includes(t)).length;
  return matchCount >= Math.max(1, Math.ceil(tokens.length * 0.5));
}

/**
 * Check if a social media profile URL or its search result is relevant to the business.
 * Only checks URL slug and result title — NOT snippet, because snippets always mention the
 * business name (since that's what we searched for) and cause false matches.
 */
function socialProfileMatchesBusiness(item: SerperResult, businessName: string): boolean {
  const tokens = nameTokens(businessName);
  if (tokens.length === 0) return false;

  // Check URL slug (e.g. instagram.com/marquezfooddenver -> "marquezfooddenver")
  try {
    const slug = new URL(item.link).pathname.replace(/\/+/g, '/').replace(/^\/|\/$/g, '').toLowerCase();
    const slugClean = slug.replace(/[^a-z0-9]/g, '');
    const slugMatches = tokens.filter(t => slugClean.includes(t)).length;
    if (slugMatches >= Math.max(1, Math.ceil(tokens.length * 0.5))) return true;
  } catch { /* ignore parse errors */ }

  // Check result title — but only the part before common suffixes like "| Facebook", "- Instagram"
  const titleRaw = item.title.split(/[|\-–—]/)[0] || item.title;
  const titleLower = titleRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const titleMatches = tokens.filter(t => titleLower.includes(t)).length;
  if (titleMatches >= Math.max(1, Math.ceil(tokens.length * 0.5))) return true;

  return false;
}

/**
 * Extract email from search snippets with relevance validation.
 * Only returns emails that appear to actually belong to the target business.
 */
function extractEmailFromSnippets(results: SerperResult[], businessName: string): string | null {
  const candidates: { email: string; score: number }[] = [];

  for (const item of results) {
    const text = `${item.title} ${item.snippet}`;
    const matches = text.match(EMAIL_REGEX);
    if (!matches) continue;

    for (const email of matches) {
      if (!isLikelyBusinessEmail(email)) continue;

      let score = 0;
      if (emailMatchesBusinessName(email, businessName)) score += 3;
      if (resultIsAboutBusiness(item, businessName)) score += 1;

      if (score >= 3) {
        candidates.push({ email, score });
      }
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  console.log(`Email candidates: ${candidates.map(c => `${c.email}(${c.score})`).join(', ')}`);
  return candidates[0].email;
}

export interface SocialSearchResult {
  url: string | null;
  email: string | null;
}

export async function searchForFacebookPage(
  businessName: string,
  city: string,
): Promise<SocialSearchResult> {
  const { isFacebookPageUrl } = await import('./facebook');
  const query = `"${businessName}" "${city}" site:facebook.com`;
  const data = await serperSearch(query);
  const results = data.organic || [];

  let url: string | null = null;
  for (const item of results) {
    if (isFacebookPageUrl(item.link) && socialProfileMatchesBusiness(item, businessName)) {
      url = item.link;
      break;
    }
  }

  const email = extractEmailFromSnippets(results, businessName);

  return { url, email };
}

/**
 * Email search via Serper — single query to minimize API usage.
 */
export async function searchForEmail(
  businessName: string,
  city: string,
): Promise<string | null> {
  const query = `"${businessName}" "${city}" email gmail.com`;
  const data = await serperSearch(query);
  const results = data.organic || [];
  const email = extractEmailFromSnippets(results, businessName);
  if (email) return email;

  if (data.knowledgeGraph?.attributes) {
    for (const [key, value] of Object.entries(data.knowledgeGraph.attributes)) {
      if (/email|e-mail|contact/i.test(key)) {
        const matches = value.match(EMAIL_REGEX);
        if (matches) {
          const valid = matches.find(isLikelyBusinessEmail);
          if (valid) return valid;
        }
      }
    }
  }

  return null;
}

function isInstagramProfileUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('instagram.com')) return false;
    const path = u.pathname.replace(/\/+$/, '');
    const skip = ['/p/', '/reel/', '/stories/', '/explore/', '/accounts/', '/tv/'];
    if (skip.some(s => path.includes(s))) return false;
    const segments = path.split('/').filter(Boolean);
    return segments.length === 1 && segments[0].length > 0;
  } catch {
    return false;
  }
}

export async function searchForInstagram(
  businessName: string,
  city: string,
): Promise<SocialSearchResult> {
  const query = `"${businessName}" "${city}" site:instagram.com`;
  const data = await serperSearch(query);
  const results = data.organic || [];

  let url: string | null = null;
  for (const item of results) {
    if (isInstagramProfileUrl(item.link) && socialProfileMatchesBusiness(item, businessName)) {
      url = item.link;
      break;
    }
  }

  // Try to find email in Instagram search snippets
  const email = extractEmailFromSnippets(results, businessName);

  return { url, email };
}

const SOCIAL_DOMAINS = [
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
  'tiktok.com', 'youtube.com', 'yelp.com', 'tripadvisor.com',
  'doordash.com', 'ubereats.com', 'grubhub.com', 'postmates.com',
  'zmenu.com', 'menupages.com', 'allmenus.com', 'menuism.com',
  'foursquare.com', 'yellowpages.com', 'bbb.org', 'mapquest.com',
  'google.com', 'linkedin.com', 'pinterest.com',
];

/**
 * Search for a business website when Google Places doesn't have one.
 * Returns the URL if a likely business website is found.
 */
export async function searchForWebsite(
  businessName: string,
  city: string,
): Promise<string | null> {
  const query = `"${businessName}" ${city} official website`;
  const data = await serperSearch(query);
  const results = data.organic || [];

  for (const item of results) {
    try {
      const hostname = new URL(item.link).hostname.toLowerCase();
      const isSocial = SOCIAL_DOMAINS.some(d => hostname.includes(d));
      if (isSocial) continue;

      // Check if the result title or URL slug relates to the business
      const tokens = nameTokens(businessName);
      if (tokens.length === 0) continue;

      const slugClean = hostname.replace(/[^a-z0-9]/g, '') +
        new URL(item.link).pathname.replace(/[^a-z0-9]/g, '').toLowerCase();
      const titleLower = item.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

      const slugMatch = tokens.filter(t => slugClean.includes(t)).length;
      const titleMatch = tokens.filter(t => titleLower.includes(t)).length;

      if (slugMatch >= Math.max(1, Math.ceil(tokens.length * 0.5)) ||
          titleMatch >= Math.max(1, Math.ceil(tokens.length * 0.5))) {
        console.log(`Website discovered via Serper: ${item.link}`);
        return item.link;
      }
    } catch { /* skip bad URLs */ }
  }

  return null;
}

export interface MenuSnippet {
  source: string;
  url: string;
  text: string;
}

export async function searchForMenuItems(
  businessName: string,
  city: string,
): Promise<MenuSnippet[]> {
  const query = `"${businessName}" "${city}" menu`;
  const data = await serperSearch(query);
  const results = data.organic || [];

  return results
    .filter(item => item.snippet && item.snippet.length > 20)
    .map(item => ({
      source: item.title,
      url: item.link,
      text: item.snippet,
    }));
}

export type WebsiteQuality = 'none' | 'poor' | 'basic' | 'good';

interface CheckResult {
  quality: WebsiteQuality;
  signals: string[];
}

function stripTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch a vendor's website and grade it based on content quality.
 * Focused on what matters for a food business: menu, images, contact, hours, ordering.
 */
export async function checkWebsiteQuality(websiteUrl: string | null): Promise<CheckResult> {
  if (!websiteUrl) {
    return { quality: 'none', signals: ['no website'] };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { quality: 'poor', signals: [`HTTP ${res.status} — site may be down`] };
    }

    const html = await res.text();
    const htmlLower = html.toLowerCase();
    const signals: string[] = [];
    let score = 0;

    // --- Content quality signals ---

    // Word count (visible text)
    const visibleText = stripTags(html);
    const wordCount = visibleText.split(/\s+/).filter(w => w.length > 1).length;
    if (wordCount < 50) {
      signals.push(`very thin content (${wordCount} words)`);
      score -= 2;
    } else if (wordCount < 150) {
      signals.push(`low content (${wordCount} words)`);
    } else {
      signals.push(`${wordCount} words`);
      score += 2;
    }

    // Images
    const imgCount = (html.match(/<img\b/gi) || []).length;
    if (imgCount === 0) {
      signals.push('no images');
      score -= 1;
    } else if (imgCount >= 3) {
      signals.push(`${imgCount} images`);
      score += 2;
    } else {
      signals.push(`${imgCount} image${imgCount > 1 ? 's' : ''}`);
      score += 1;
    }

    // Menu / food keywords
    const menuKeywords = /\bmenu\b|menu item|food|dish|cuisine|appetizer|entree|dessert|\$\d+/i;
    if (menuKeywords.test(visibleText)) {
      signals.push('has menu/food content');
      score += 2;
    } else {
      signals.push('no menu content');
    }

    // Contact info
    const hasPhone = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(visibleText);
    const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(visibleText);
    const hasAddress = /\b\d+\s+[\w\s]+(?:st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|way|ct|court)\b/i.test(visibleText);
    const contactCount = [hasPhone, hasEmail, hasAddress].filter(Boolean).length;
    if (contactCount >= 2) {
      signals.push('has contact info');
      score += 2;
    } else if (contactCount === 1) {
      signals.push('partial contact info');
      score += 1;
    } else {
      signals.push('no contact info');
    }

    // Business hours
    const hoursPattern = /\b(hours|open|closed)\b.*\b(mon|tue|wed|thu|fri|sat|sun|am|pm|\d{1,2}:\d{2})\b/i;
    const dayPattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
    if (hoursPattern.test(visibleText) || dayPattern.test(visibleText)) {
      signals.push('has business hours');
      score += 1;
    }

    // Online ordering / CTA
    const orderingPatterns = /order\s*online|order\s*now|doordash|ubereats|uber\s*eats|grubhub|postmates|caviar|seamless|toast|square|clover/i;
    if (orderingPatterns.test(html)) {
      signals.push('has online ordering');
      score += 2;
    }

    // Navigation / structure
    const headingCount = (html.match(/<h[1-6]\b/gi) || []).length;
    const navLinks = (html.match(/<a\b[^>]*href/gi) || []).length;
    if (headingCount >= 3 && navLinks >= 5) {
      signals.push('well-structured');
      score += 1;
    } else if (headingCount <= 1 && navLinks <= 2) {
      signals.push('minimal structure');
      score -= 1;
    }

    // --- Technical signals (lower weight) ---

    const finalUrl = res.url || websiteUrl;
    if (!finalUrl.startsWith('https://')) {
      signals.push('no HTTPS');
      score -= 1;
    }

    if (!/meta[^>]+name=["']viewport["']/i.test(html)) {
      signals.push('not mobile-friendly');
      score -= 1;
    }

    // Known placeholder / free-tier builder detection
    const placeholderPatterns = [
      { test: /this\s+domain|parked\s+domain|under\s+construction|coming\s+soon/i, label: 'placeholder page' },
      { test: /wix\.com\/upgrade|create\s+your\s+website/i, label: 'free-tier builder' },
    ];
    for (const { test, label } of placeholderPatterns) {
      if (test.test(htmlLower)) {
        signals.push(label);
        score -= 3;
      }
    }

    // Hard cap: pages with < 50 words can't be more than 'poor'
    let quality: WebsiteQuality;
    if (wordCount < 50 || score <= 1) {
      quality = 'poor';
    } else if (score <= 5) {
      quality = 'basic';
    } else {
      quality = 'good';
    }

    console.log(`Website check ${websiteUrl}: quality=${quality}, score=${score}, signals=[${signals.join(', ')}]`);
    return { quality, signals };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('abort')) {
      return { quality: 'poor', signals: ['website timed out (>8s)'] };
    }
    return { quality: 'poor', signals: [`fetch error: ${msg}`] };
  }
}

/**
 * Sort priority: none=0 (highest), poor=1, basic=2, good=3 (lowest).
 */
export function websiteQualitySortOrder(quality: string | null): number {
  switch (quality) {
    case 'none': return 0;
    case 'poor': return 1;
    case 'basic': return 2;
    case 'good': return 3;
    default: return 0;
  }
}

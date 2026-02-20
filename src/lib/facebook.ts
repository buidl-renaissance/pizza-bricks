/**
 * Facebook URL utilities — used by customSearch.ts to validate/parse
 * Facebook page URLs found via Serper. No Facebook API calls.
 */

export function isFacebookPageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('facebook.com')) return false;
    const path = parsed.pathname.toLowerCase();
    if (/\/(videos|posts|photos|events|stories|reels|watch|groups|marketplace)\b/.test(path)) return false;
    return true;
  } catch {
    return false;
  }
}

export function extractPageIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('facebook.com')) return null;

    const path = parsed.pathname.replace(/\/$/, '');
    const segments = path.split('/').filter(Boolean);

    if (segments[0] === 'pages' && segments.length >= 3) {
      return segments[segments.length - 1];
    }
    if (segments[0] === 'profile.php') {
      return parsed.searchParams.get('id');
    }
    if (segments[0] === 'p' && segments.length === 2) {
      const match = segments[1].match(/(\d{10,})$/);
      return match ? match[1] : segments[1];
    }
    if (segments.length === 1) {
      const match = segments[0].match(/(\d{10,})$/);
      return match ? match[1] : segments[0];
    }

    return segments[segments.length - 1] || null;
  } catch {
    return null;
  }
}

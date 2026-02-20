import type { BrandBrief } from './brand-brief';

export interface GeneratedPrompts {
  systemPrompt: string;
  userPrompt: string;
}

type VendorVariant = {
  ctaPrimary: string;
  ctaSecondary: string;
  addressNote: string;
};

const VENDOR_VARIANTS: Record<string, VendorVariant> = {
  home_caterer: {
    ctaPrimary: 'Order Now',
    ctaSecondary: 'Book Your Order',
    addressNote:
      'Do NOT show a physical address. This is a home catering business — orders are arranged by contact only.',
  },
  food_truck: {
    ctaPrimary: 'Find Our Truck',
    ctaSecondary: 'View Schedule',
    addressNote:
      'Include a "Find Our Truck" section linking to the schedule. No fixed address.',
  },
  brick_and_mortar: {
    ctaPrimary: 'Get Directions',
    ctaSecondary: 'Order Online',
    addressNote: 'Show the full address prominently and include a map link.',
  },
};

export function buildPrompts(brief: BrandBrief): GeneratedPrompts {
  const variant =
    VENDOR_VARIANTS[brief.business.vendorType] ?? VENDOR_VARIANTS.home_caterer;

  const systemPrompt = `You are an expert Next.js + Tailwind CSS developer specializing in food business marketing websites.

Your task is to generate a complete, production-ready Next.js marketing website for a food business.

CRITICAL OUTPUT REQUIREMENT: Return ONLY valid JSON. No markdown fences, no code blocks, no explanation, no preamble. Start your response with { and end with }.

Required JSON structure:
{
  "files": [
    { "path": "package.json", "content": "..." },
    { "path": "next.config.js", "content": "..." },
    { "path": "tailwind.config.js", "content": "..." },
    { "path": "postcss.config.js", "content": "..." },
    { "path": "pages/_app.tsx", "content": "..." },
    { "path": "pages/index.tsx", "content": "..." },
    { "path": "pages/api/contact.ts", "content": "..." },
    { "path": "styles/globals.css", "content": "..." }
  ]
}

Technical requirements:
- Next.js 14, Tailwind CSS 3, TypeScript
- All file content must be valid, complete code (no TODOs, no placeholders)
- Use TypeScript throughout (not JavaScript)
- Mobile-first responsive design
- Proper JSON string escaping: use \\n for newlines inside string values, escape all quotes with \\"
- package.json must include: next, react, react-dom, typescript, tailwindcss, postcss, autoprefixer
- CRITICAL JSX RULES (violating these causes TypeScript build failure):
  1. Every component return() must have exactly ONE root element — wrap siblings in <> ... </>
  2. Inside JSX expressions {}, if you render multiple elements write them as {cond && (<><A /><B /></>)} — NEVER {cond && <A /><B />}
  3. Every opening JSX tag must have a matching closing tag or be self-closing (e.g. <img />, not <img>)
  4. String template literals inside JSX must use backticks if they contain expressions, or be proper JSX

Design requirements:
- Primary CTA: "${variant.ctaPrimary}"
- Secondary CTA: "${variant.ctaSecondary}"
- ${variant.addressNote}
- Use the provided primaryColor as the main brand color
- Use the provided accentColor as secondary
- Apply the brand voice in all copy
- Sections: Hero, Menu, About/Story, Contact/Order
- Include a sticky navigation header
- Include a footer with contact info and social links`;

  const menuLines = brief.menu
    .map(
      (item) =>
        `  - ${item.name}: ${item.price}${item.description ? ` — ${item.description}` : ''}`
    )
    .join('\n');

  const reviewLines =
    brief.reviews && brief.reviews.length > 0
      ? brief.reviews
          .map((r) => `  - "${r.text}" — ${r.author} (${r.rating}/5)`)
          .join('\n')
      : '  (none provided)';

  const socialLines = brief.social
    ? Object.entries(brief.social)
        .filter(([, v]) => v)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n') || '  (none)'
    : '  (none)';

  const userPrompt = `Generate the complete marketing website for this food business:

BUSINESS INFO
  Name: ${brief.business.name}
  Type: ${brief.business.vendorType}
  City: ${brief.business.city}
  Phone: ${brief.business.phone ?? 'not provided'}
  Email: ${brief.business.email ?? 'not provided'}
  Hours: ${brief.business.hours ?? 'not provided'}

BRAND IDENTITY
  Primary color: ${brief.brand.primaryColor}
  Accent color: ${brief.brand.accentColor}
  Tagline: "${brief.brand.tagline}"
  Voice: ${brief.brand.voice}

MENU
${menuLines}

SOCIAL MEDIA
${socialLines}

CUSTOMER REVIEWS
${reviewLines}

Generate the full Next.js + Tailwind site now. Remember: output ONLY the JSON object, nothing else.`;

  return { systemPrompt, userPrompt };
}

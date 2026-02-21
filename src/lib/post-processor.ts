import { BrandBrief } from './brand-brief';
import { GeneratedFile } from './site-generator';

export interface PostProcessorOptions {
  brief: BrandBrief;
  analyticsId?: string;
}

function buildSchemaOrgLd(brief: BrandBrief): string {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: brief.business.name,
    description: brief.brand.tagline,
    address: {
      '@type': 'PostalAddress',
      addressLocality: brief.business.city,
    },
  };

  if (brief.business.phone) {
    schema.telephone = brief.business.phone;
  }
  if (brief.business.email) {
    schema.email = brief.business.email;
  }
  if (brief.menu.length > 0) {
    schema.hasMenu = {
      '@type': 'Menu',
      hasMenuSection: [
        {
          '@type': 'MenuSection',
          hasMenuItem: brief.menu.map((item) => ({
            '@type': 'MenuItem',
            name: item.name,
            offers: {
              '@type': 'Offer',
              price: item.price,
            },
            ...(item.description ? { description: item.description } : {}),
          })),
        },
      ],
    };
  }

  return JSON.stringify(schema, null, 2);
}

function buildOgTags(brief: BrandBrief): string {
  const siteName = brief.business.name;
  const description = brief.brand.tagline;
  const heroUrl = brief.media.hero ?? '';

  return `      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="${siteName}" />
      <meta property="og:title" content="${siteName}" />
      <meta property="og:description" content="${description}" />
      ${heroUrl ? `<meta property="og:image" content="${heroUrl}" />` : ''}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${siteName}" />
      <meta name="twitter:description" content="${description}" />`;
}

function injectIntoIndexPage(content: string, brief: BrandBrief): string {
  const schemaLd = buildSchemaOrgLd(brief);
  const ogTags = buildOgTags(brief);

  const schemaScript = `      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: \`${schemaLd}\` }}
      />`;

  // Inject Schema.org + OG tags into <Head> — insert before closing </Head>
  let result = content;
  if (result.includes('</Head>')) {
    result = result.replace(
      '</Head>',
      `${ogTags}\n${schemaScript}\n      </Head>`
    );
  }

  // Inject Pizzabox badge div before closing </footer> or </Footer> or </body>
  const badgeDiv = `\n      <div id="pizzabox-badge" />`;
  if (result.includes('</footer>')) {
    result = result.replace('</footer>', `${badgeDiv}\n      </footer>`);
  } else if (result.includes('</Footer>')) {
    result = result.replace('</Footer>', `${badgeDiv}\n      </Footer>`);
  } else if (result.includes('</body>')) {
    result = result.replace('</body>', `${badgeDiv}\n    </body>`);
  }

  return result;
}

function injectAnalyticsIntoApp(content: string): string {
  if (content.includes('@vercel/analytics')) return content;

  // Add Analytics import after last existing import
  let result = content;
  const lastImportIdx = result.lastIndexOf('import ');
  const lineEnd = result.indexOf('\n', lastImportIdx);
  if (lineEnd !== -1) {
    result =
      result.slice(0, lineEnd + 1) +
      `import { Analytics } from '@vercel/analytics/react';\n` +
      result.slice(lineEnd + 1);
  }

  // Wrap the return value in a Fragment and append <Analytics />.
  // Handles both `return <Component ... />` and `return (\n  <Component ... />\n)`.
  // Self-closing: return <Component {...pageProps} />
  result = result.replace(
    /(\breturn\s*)\(<?\s*\n?\s*(<Component[^>]*\/>)\s*\n?\s*\)([;\s]*\})/,
    (_m, ret, comp, tail) =>
      `${ret}(\n    <>\n      ${comp}\n      <Analytics />\n    </>\n  )${tail}`
  );
  // Without parens: return <Component ... />;
  result = result.replace(
    /(\breturn\s*)(<Component[^>]*\/>)([;\s]*\n)/,
    (_m, ret, comp, tail) =>
      `${ret}(\n    <>\n      ${comp}\n      <Analytics />\n    </>\n  );\n`
  );

  return result;
}


function injectAnalyticsDependency(content: string): string {
  try {
    const pkg = JSON.parse(content) as Record<string, unknown>;
    const deps = (pkg.dependencies as Record<string, string>) ?? {};
    if (!deps['@vercel/analytics']) {
      deps['@vercel/analytics'] = '^1';
      pkg.dependencies = deps;
    }
    return JSON.stringify(pkg, null, 2);
  } catch {
    // If parsing fails, return as-is
    return content;
  }
}

export function postProcess(
  files: GeneratedFile[],
  options: PostProcessorOptions
): GeneratedFile[] {
  return files.map((file) => {
    if (file.path === 'pages/index.tsx') {
      return { ...file, content: injectIntoIndexPage(file.content, options.brief) };
    }
    if (file.path === 'pages/_app.tsx') {
      return { ...file, content: injectAnalyticsIntoApp(file.content) };
    }
    if (file.path === 'package.json') {
      return { ...file, content: injectAnalyticsDependency(file.content) };
    }
    return file;
  });
}

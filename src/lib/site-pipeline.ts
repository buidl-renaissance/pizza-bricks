import { extractBrandBrief } from './brand-brief-extractor';
import { generateSite } from './site-generator';
import { postProcess } from './post-processor';
import {
  deployToVercel,
  waitForDeployment,
  DeploymentStatus,
} from './vercel-deployer';

export interface PipelineResult {
  url: string;
  deploymentId: string;
  projectId: string;
  status: DeploymentStatus;
}

export interface BiteBiteConfig {
  /** Base URL for bitebite buy flow (default: https://bitebitebot.vercel.app) */
  baseUrl?: string;
  /** Business slug for configuration path (e.g. EthDenver) */
  businessSlug: string;
  /** Recipient wallet address for payments */
  recipientAddress: string;
}

export interface PipelineOptions {
  /** Raw text document from the upstream brand intelligence agent */
  document: string;
  /** If true, polls Vercel until the deployment is READY or ERROR. Default: true */
  waitForReady?: boolean;
  /** Prospect ID for stable project naming (first deploy) */
  prospectId?: string;
  /** Deploy to existing Vercel project (updates instead of creating new) */
  existingProjectId?: string;
  /** Config for menu item buy links (bitebitebot.vercel.app) */
  biteBiteConfig?: BiteBiteConfig;
}

export function deriveBiteBiteConfig(
  prospect: { name: string; metadata?: string | null }
): BiteBiteConfig | undefined {
  const baseUrl = process.env.BITE_BITE_BASE_URL ?? 'https://bitebitebot.vercel.app';
  const defaultRecipient = process.env.BITE_BITE_RECIPIENT_ADDRESS;
  let businessSlug: string | undefined;
  let recipientAddress: string | undefined;

  if (prospect.metadata) {
    try {
      const meta = JSON.parse(prospect.metadata) as Record<string, unknown>;
      businessSlug = meta.biteBiteBusinessSlug as string | undefined;
      recipientAddress = meta.biteBiteRecipientAddress as string | undefined;
    } catch {
      /* ignore */
    }
  }

  businessSlug ??= prospect.name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  recipientAddress ??= defaultRecipient;

  if (!recipientAddress) return undefined;
  return { baseUrl, businessSlug, recipientAddress };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .slice(0, 40);
}

export async function runSitePipeline(
  options: PipelineOptions
): Promise<PipelineResult> {
  const { document, waitForReady = true, prospectId, existingProjectId, biteBiteConfig } = options;

  // Step 1: Extract structured BrandBrief from raw text
  console.log('[pipeline] step 1/5 — extracting brand brief');
  const brief = await extractBrandBrief(document);

  // Step 2: Generate site files via Claude
  console.log('[pipeline] step 2/5 — generating site');
  const generatedSite = await generateSite(brief, biteBiteConfig);

  // Step 3: Post-process (inject analytics, Schema.org, badge)
  console.log('[pipeline] step 3/5 — post-processing');
  const processedFiles = postProcess(generatedSite.files, { brief, biteBiteConfig });

  // Step 4: Deploy to Vercel
  const projectName = existingProjectId
    ? `pizzabox-${slugify(brief.business.name)}`
    : prospectId
      ? `pizzabox-${slugify(brief.business.name)}-${prospectId.slice(0, 8)}`
      : `pizzabox-${slugify(brief.business.name)}-${Date.now().toString(36)}`;
  console.log(`[pipeline] step 4/5 — deploying as "${projectName}"${existingProjectId ? ' (existing project)' : ''}`);
  const deployment = await deployToVercel({
    name: projectName,
    files: processedFiles,
    ...(existingProjectId ? { projectId: existingProjectId } : {}),
  });

  // Step 5: Wait for deployment to be ready (optional)
  if (waitForReady) {
    console.log('[pipeline] step 5/5 — waiting for deployment to be ready');
    const final = await waitForDeployment(deployment.id);
    return {
      url: `https://${final.url}`,
      deploymentId: final.id,
      projectId: final.projectId ?? deployment.projectId ?? '',
      status: final.readyState,
    };
  }

  return {
    url: `https://${deployment.url}`,
    deploymentId: deployment.id,
    projectId: deployment.projectId ?? '',
    status: deployment.readyState,
  };
}

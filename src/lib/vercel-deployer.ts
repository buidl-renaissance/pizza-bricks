import { GeneratedFile } from './site-generator';

const VERCEL_API = 'https://api.vercel.com';

export type DeploymentStatus =
  | 'QUEUED'
  | 'BUILDING'
  | 'INITIALIZING'
  | 'READY'
  | 'ERROR'
  | 'CANCELED';

export interface VercelDeployment {
  id: string;
  url: string;
  name: string;
  readyState: DeploymentStatus;
  projectId?: string;
}

export interface DeployOptions {
  name: string;
  files: GeneratedFile[];
  /** Deploy to existing Vercel project by ID (reuses project instead of creating new) */
  projectId?: string;
}

interface VercelFile {
  file: string;
  data: string;
  encoding: 'utf-8';
}

export function toVercelFiles(files: GeneratedFile[]): VercelFile[] {
  return files.map((f) => ({
    file: f.path,
    data: f.content,
    encoding: 'utf-8',
  }));
}

function buildHeaders(): Record<string, string> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error('VERCEL_TOKEN env var is not set');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function buildUrl(path: string): string {
  const teamId = process.env.VERCEL_TEAM_ID;
  const url = new URL(`${VERCEL_API}${path}`);
  if (teamId) url.searchParams.set('teamId', teamId);
  return url.toString();
}

const BUILD_ERROR_SUMMARY_MAX_LEN = 500;

export interface DeploymentEvent {
  type?: string;
  created?: number;
  payload?: { text?: string; [key: string]: unknown };
}

/**
 * Fetches deployment build events from Vercel and returns an error summary
 * (first ~500 chars of error-like log lines) plus optional raw events.
 */
export async function getDeploymentBuildLogs(
  deploymentId: string,
  opts: { rawEvents?: boolean } = {}
): Promise<{ buildErrorSummary: string; rawEvents?: DeploymentEvent[] }> {
  const url = new URL(buildUrl(`/v3/deployments/${deploymentId}/events`));
  url.searchParams.set('limit', '200');
  const res = await fetch(url.toString(), { headers: buildHeaders() });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vercel getDeploymentBuildLogs failed (${res.status}): ${err}`);
  }
  const events: DeploymentEvent[] = await res.json();
  const errorLines: string[] = [];
  for (const ev of events) {
    const text = ev.payload?.text;
    if (typeof text === 'string' && text.trim()) {
      const lower = text.toLowerCase();
      if (lower.includes('error') || lower.includes('failed') || ev.type === 'stderr') {
        errorLines.push(text.trim());
      }
    }
  }
  const combined = errorLines.join('\n').slice(0, BUILD_ERROR_SUMMARY_MAX_LEN);
  const buildErrorSummary = combined || 'Build failed (no error details in logs).';
  const out: { buildErrorSummary: string; rawEvents?: DeploymentEvent[] } = {
    buildErrorSummary,
  };
  if (opts.rawEvents) out.rawEvents = events;
  return out;
}

async function disableProjectProtection(projectId: string): Promise<void> {
  const res = await fetch(buildUrl(`/v9/projects/${projectId}`), {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify({ ssoProtection: null }),
  });
  // Non-fatal — log but don't throw
  if (!res.ok) {
    const err = await res.text();
    console.warn(`[vercel] Could not disable project protection (${res.status}): ${err}`);
  }
}

export async function deployToVercel(
  options: DeployOptions
): Promise<VercelDeployment> {
  const body: Record<string, unknown> = {
    name: options.name,
    files: toVercelFiles(options.files),
    framework: 'nextjs',
    projectSettings: {
      framework: 'nextjs',
    },
    target: 'production',
  };
  if (options.projectId) {
    body.project = options.projectId;
  }

  const res = await fetch(buildUrl('/v13/deployments'), {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vercel deployment failed (${res.status}): ${err}`);
  }

  const deployment = await res.json() as VercelDeployment;

  // Disable SSO/deployment protection so the site is publicly accessible
  if (deployment.projectId) {
    await disableProjectProtection(deployment.projectId);
  }

  return deployment;
}

export async function getDeploymentStatus(
  deploymentId: string
): Promise<VercelDeployment> {
  const res = await fetch(buildUrl(`/v13/deployments/${deploymentId}`), {
    headers: buildHeaders(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vercel getDeploymentStatus failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<VercelDeployment>;
}

export async function waitForDeployment(
  deploymentId: string
): Promise<VercelDeployment> {
  const INTERVAL_MS = 5000;
  const MAX_POLLS = 60; // 5 minutes

  for (let i = 0; i < MAX_POLLS; i++) {
    const deployment = await getDeploymentStatus(deploymentId);

    if (deployment.readyState === 'READY' || deployment.readyState === 'ERROR') {
      return deployment;
    }

    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }

  throw new Error(
    `Vercel deployment ${deploymentId} timed out after ${MAX_POLLS * INTERVAL_MS / 1000}s`
  );
}

// ── Fetch deployment source files (for prompt-based edits) ────────────────────

export interface VercelFileNode {
  name: string;
  type: 'file' | 'directory';
  uid?: string;
  children?: VercelFileNode[];
  contentType?: string;
  mode?: string;
}

const SOURCE_EXTENSIONS = /\.(tsx?|jsx?|css|json)$/;
const EXCLUDE_PATHS = /^(\.next|node_modules)/;

function collectSourceFileUids(nodes: VercelFileNode[], basePath = ''): Array<{ path: string; uid: string }> {
  const result: Array<{ path: string; uid: string }> = [];
  for (const node of nodes) {
    const path = basePath ? `${basePath}/${node.name}` : node.name;
    if (EXCLUDE_PATHS.test(path)) continue;
    if (node.type === 'file' && node.uid && SOURCE_EXTENSIONS.test(node.name)) {
      result.push({ path, uid: node.uid });
    }
    if (node.type === 'directory' && node.children?.length) {
      result.push(...collectSourceFileUids(node.children, path));
    }
  }
  return result;
}

/**
 * List deployment file tree. Only works for deployments created with the files key.
 */
export async function listDeploymentFiles(deploymentId: string): Promise<VercelFileNode[]> {
  const res = await fetch(buildUrl(`/v6/deployments/${deploymentId}/files`), {
    headers: buildHeaders(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vercel listDeploymentFiles failed (${res.status}): ${err}`);
  }
  return res.json() as Promise<VercelFileNode[]>;
}

/**
 * Get base64-encoded file content from a deployment.
 */
export async function getDeploymentFileContent(deploymentId: string, fileId: string): Promise<string> {
  const res = await fetch(buildUrl(`/v8/deployments/${deploymentId}/files/${fileId}`), {
    headers: buildHeaders(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vercel getDeploymentFileContent failed (${res.status}): ${err}`);
  }
  const json = (await res.json()) as { content?: string };
  const content = json?.content;
  if (typeof content !== 'string') {
    throw new Error('Vercel getDeploymentFileContent: missing content in response');
  }
  return Buffer.from(content, 'base64').toString('utf-8');
}

/**
 * Fetch all source files from a deployment as GeneratedFile[].
 */
export async function fetchDeploymentSource(deploymentId: string): Promise<GeneratedFile[]> {
  const tree = await listDeploymentFiles(deploymentId);
  const entries = collectSourceFileUids(tree);
  const files: GeneratedFile[] = [];
  for (const { path, uid } of entries) {
    const content = await getDeploymentFileContent(deploymentId, uid);
    files.push({ path, content });
  }
  return files;
}

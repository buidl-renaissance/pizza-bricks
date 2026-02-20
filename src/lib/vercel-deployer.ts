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

export async function deployToVercel(
  options: DeployOptions
): Promise<VercelDeployment> {
  const body = {
    name: options.name,
    files: toVercelFiles(options.files),
    framework: 'nextjs',
    projectSettings: {
      framework: 'nextjs',
    },
    target: 'production',
  };

  const res = await fetch(buildUrl('/v13/deployments'), {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vercel deployment failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<VercelDeployment>;
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

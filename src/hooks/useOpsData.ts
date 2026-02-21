import { useEffect, useState, useCallback, useRef } from 'react';
import type { ActivityEvent, Prospect, AgentStateRow, GeneratedSite } from '@/db/ops';

/** Prospect with outreach-email-sent flag (from GET /api/ops/prospects). */
export type ProspectWithOutreach = Prospect & { outreachEmailSent: boolean };
import type { Alert } from '@/lib/agent/workflows/alerts';
import type { PipelineStage, GeneratedSiteStatus } from '@/db/schema';

export type EnrichedSite = GeneratedSite & { prospectName: string };

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export interface MetricsOverview {
  totalProspects: number;
  contacted: number;
  converted: number;
  activeSites: number;
  agentStatus: string;
}

export interface PipelineStageSummary {
  stage: PipelineStage;
  count: number;
}

export interface ChannelStats {
  email: { total: number; sent: number; opened: number; replied: number; bounced: number; openRate: number; replyRate: number };
  sites: { total: number; published: number; generating: number };
  chatbot: { conversations: number; leads: number; conversionRate: number };
}

export function useMetrics() {
  const [data, setData] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch<MetricsOverview>('/api/ops/metrics/overview');
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload };
}

export function usePipelineSummary() {
  const [data, setData] = useState<PipelineStageSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch<{ stages: PipelineStageSummary[] }>('/api/ops/pipeline/summary');
      setData(d.stages);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, reload };
}

export function useChannelStats() {
  const [data, setData] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch<ChannelStats>('/api/ops/channels/stats');
      setData(d);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, reload };
}

export function useActivityLog(opts: { type?: string; triggeredBy?: 'agent' | 'manual' | 'system'; limit?: number } = {}) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts.type) params.set('type', opts.type);
      if (opts.triggeredBy) params.set('triggeredBy', opts.triggeredBy);
      if (opts.limit) params.set('limit', String(opts.limit));
      const d = await apiFetch<{ events: ActivityEvent[] }>(`/api/ops/activity?${params}`);
      setEvents(d.events);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [opts.type, opts.triggeredBy, opts.limit]);

  useEffect(() => { reload(); }, [reload]);
  return { events, loading, reload };
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch<{ alerts: Alert[] }>('/api/ops/alerts');
      setAlerts(d.alerts);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { alerts, loading, reload };
}

export function useAgentState() {
  const [state, setState] = useState<AgentStateRow | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch<{ state: AgentStateRow }>('/api/ops/agent/status');
      setState(d.state);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const pause = useCallback(async () => {
    await fetch('/api/ops/agent/pause', { method: 'POST' });
    await reload();
  }, [reload]);

  const resume = useCallback(async () => {
    await fetch('/api/ops/agent/resume', { method: 'POST' });
    await reload();
  }, [reload]);

  return { state, loading, reload, pause, resume };
}

export function useProspects(opts: { stage?: PipelineStage; limit?: number } = {}) {
  const [prospects, setProspects] = useState<ProspectWithOutreach[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts.stage) params.set('stage', opts.stage);
      if (opts.limit) params.set('limit', String(opts.limit));
      const d = await apiFetch<{ prospects: ProspectWithOutreach[] }>(`/api/ops/prospects?${params}`);
      setProspects(d.prospects);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [opts.stage, opts.limit]);

  useEffect(() => { reload(); }, [reload]);
  return { prospects, loading, reload };
}

// ── Sites ─────────────────────────────────────────────────────────────────────

export function useSites(opts: { prospectId?: string; status?: GeneratedSiteStatus } = {}) {
  const [sites, setSites] = useState<EnrichedSite[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts.prospectId) params.set('prospectId', opts.prospectId);
      if (opts.status) params.set('status', opts.status);
      const d = await apiFetch<{ sites: EnrichedSite[] }>(`/api/ops/sites?${params}`);
      setSites(d.sites);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [opts.prospectId, opts.status]);

  useEffect(() => { reload(); }, [reload]);
  return { sites, loading, reload };
}

/**
 * Polls a single site every `intervalMs` while status is 'generating'.
 * Stops automatically once the status reaches a terminal state.
 */
export function useSiteStatus(siteId: string | null, intervalMs = 5000) {
  const [site, setSite] = useState<EnrichedSite | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    if (!siteId) return;
    try {
      const d = await apiFetch<{ site: EnrichedSite }>(`/api/ops/sites/${siteId}`);
      setSite(d.site);
      setLoading(false);
      if (d.site.status === 'generating') {
        timerRef.current = setTimeout(poll, intervalMs);
      }
    } catch {
      setLoading(false);
    }
  }, [siteId, intervalMs]);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    poll();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [siteId, poll]);

  return { site, loading };
}

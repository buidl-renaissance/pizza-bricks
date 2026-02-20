import { useEffect, useState, useCallback } from 'react';
import type { ActivityEvent, Prospect, AgentStateRow } from '@/db/ops';
import type { Alert } from '@/lib/agent/workflows/alerts';
import type { PipelineStage } from '@/db/schema';

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

export function useActivityLog(opts: { type?: string; limit?: number } = {}) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts.type) params.set('type', opts.type);
      if (opts.limit) params.set('limit', String(opts.limit));
      const d = await apiFetch<{ events: ActivityEvent[] }>(`/api/ops/activity?${params}`);
      setEvents(d.events);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [opts.type, opts.limit]);

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
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts.stage) params.set('stage', opts.stage);
      if (opts.limit) params.set('limit', String(opts.limit));
      const d = await apiFetch<{ prospects: Prospect[] }>(`/api/ops/prospects?${params}`);
      setProspects(d.prospects);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [opts.stage, opts.limit]);

  useEffect(() => { reload(); }, [reload]);
  return { prospects, loading, reload };
}

export function useActionHistory() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch<{ events: ActivityEvent[] }>('/api/ops/actions/history');
      setEvents(d.events);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { events, loading, reload };
}

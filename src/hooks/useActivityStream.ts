import { useEffect, useRef, useState } from 'react';
import type { ActivityEvent } from '@/db/ops';

export interface UseActivityStreamResult {
  events: ActivityEvent[];
  connected: boolean;
}

export function useActivityStream(maxEvents = 50): UseActivityStreamResult {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/ops/activity/stream');
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as ActivityEvent;
        setEvents(prev => [event, ...prev].slice(0, maxEvents));
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [maxEvents]);

  return { events, connected };
}

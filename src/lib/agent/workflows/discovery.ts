// STUB: Synthetic prospect discovery
// Real implementation would call Yelp Fusion API / Google Places API.
// This stub inserts 1–3 synthetic Detroit food vendor prospects per tick.

import { insertProspect, insertActivityEvent } from '@/db/ops';
import type { ProspectType, ProspectSource } from '@/db/schema';

interface DiscoveryConfig {
  maxProspectsPerTick: number;
}

const SYNTHETIC_POOL: Array<{
  name: string;
  type: ProspectType;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  source: ProspectSource;
}> = [
  { name: "Bella's Detroit Pizza", type: 'pizzeria', contactName: 'Isabella Ricci', email: 'info@bellasdetroit.com', phone: '313-555-0101', address: '1201 Woodward Ave', city: 'Detroit', source: 'yelp' },
  { name: 'Motor City Tamales', type: 'catering', contactName: 'Carlos Mendez', phone: '313-555-0102', address: '4812 Michigan Ave', city: 'Detroit', source: 'google_maps' },
  { name: 'The Rolling Bun', type: 'food_truck', contactName: 'Priya Shah', email: 'rollingbun@gmail.com', phone: '313-555-0103', city: 'Detroit', source: 'directory' },
  { name: 'Corktown Deli & Provisions', type: 'deli', contactName: 'James O\'Brien', email: 'hello@corktowndeli.com', address: '1701 Michigan Ave', city: 'Detroit', source: 'yelp' },
  { name: 'Hamtramck Bakehouse', type: 'bakery', contactName: 'Fatima Kowalski', phone: '313-555-0105', address: '9201 Jos Campau Ave', city: 'Hamtramck', source: 'google_maps' },
  { name: 'Mexicantown Express', type: 'restaurant', contactName: 'Ana Ramirez', email: 'ana@mexicantownexpress.com', phone: '313-555-0106', address: '3501 Bagley St', city: 'Detroit', source: 'yelp' },
  { name: 'Eastern Market Pierogi Co.', type: 'food_truck', email: 'pierogi@easternmarket.com', phone: '313-555-0107', city: 'Detroit', source: 'directory' },
  { name: 'Greektown Gyro Palace', type: 'restaurant', contactName: 'Nikos Papadopoulos', address: '555 Monroe St', city: 'Detroit', source: 'yelp' },
  { name: 'Southwest Detroit BBQ', type: 'catering', contactName: 'Darnell Williams', email: 'darnell@swdetroitbbq.com', phone: '313-555-0109', city: 'Detroit', source: 'google_maps' },
  { name: 'Midtown Crêperie', type: 'restaurant', email: 'info@midtowncreperie.com', address: '4201 Cass Ave', city: 'Detroit', source: 'yelp' },
  { name: 'Dearborn Shawarma House', type: 'restaurant', contactName: 'Youssef Haddad', phone: '313-555-0111', address: '13401 Michigan Ave', city: 'Dearborn', source: 'google_maps' },
  { name: 'Ferndale Fusion Bites', type: 'food_truck', contactName: 'Zoe Huang', email: 'zoe@ferndalefusion.com', city: 'Ferndale', source: 'directory' },
];

// Track which pool entries have been used to avoid immediate re-insertion (in-memory, resets on restart)
const usedIndices = new Set<number>();

export async function runDiscovery(config: DiscoveryConfig): Promise<number> {
  const max = Math.min(config.maxProspectsPerTick, 3);
  const count = 1 + Math.floor(Math.random() * max); // 1..max

  // Pick unseen entries; cycle if exhausted
  const available = SYNTHETIC_POOL
    .map((_, i) => i)
    .filter(i => !usedIndices.has(i));

  if (available.length < count) {
    usedIndices.clear();
  }

  const picks: number[] = [];
  const refreshed = SYNTHETIC_POOL.map((_, i) => i).filter(i => !usedIndices.has(i));
  for (let i = 0; i < count && picks.length < count; i++) {
    const idx = refreshed[Math.floor(Math.random() * refreshed.length)];
    if (!picks.includes(idx)) {
      picks.push(idx);
      usedIndices.add(idx);
    }
  }

  const insertedNames: string[] = [];
  for (const idx of picks) {
    const template = SYNTHETIC_POOL[idx];
    const prospect = await insertProspect({
      ...template,
      pipelineStage: 'discovered',
    });
    insertedNames.push(prospect.name);
  }

  await insertActivityEvent({
    type: 'prospect_batch_scraped',
    targetLabel: insertedNames.join(', '),
    detail: `Discovered ${insertedNames.length} new prospect(s) via synthetic discovery stub`,
    status: 'completed',
    triggeredBy: 'agent',
    metadata: { count: insertedNames.length, names: insertedNames },
  });

  return insertedNames.length;
}

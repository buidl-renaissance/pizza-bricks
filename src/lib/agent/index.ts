import {
  getAgentState,
  setAgentStatus,
  heartbeat,
  insertActivityEvent,
  insertAgentTick,
} from '@/db/ops';
import { resetUsage, getUsage } from '@/lib/usage-tracker';
import { autonomousAgentSpend } from '@/lib/agent-spend';
import { runDiscovery } from './workflows/discovery';
import { runEmailOutreach } from './workflows/email-outreach';
import { runFollowUp } from './workflows/follow-up';

interface AgentConfig {
  discoveryEnabled: boolean;
  emailEnabled: boolean;
  siteGenEnabled: boolean;
  emailRatePerHour: number;
  maxProspectsPerTick: number;
}

const DEFAULT_CONFIG: AgentConfig = {
  discoveryEnabled: true,
  emailEnabled: true,
  siteGenEnabled: true,
  emailRatePerHour: 20,
  maxProspectsPerTick: 3,
};

export async function runAgentTick(): Promise<{
  skipped: boolean;
  reason?: string;
  results: Record<string, number>;
}> {
  const state = await getAgentState();

  if (state.status !== 'running') {
    return { skipped: true, reason: `Agent is ${state.status}`, results: {} };
  }

  let config: AgentConfig = DEFAULT_CONFIG;
  try {
    if (state.config) {
      config = { ...DEFAULT_CONFIG, ...JSON.parse(state.config) };
    }
  } catch {
    // use defaults
  }

  await heartbeat();

  const tickStartedAt = new Date();
  resetUsage();

  const results: Record<string, number> = {};

  // 1. Discovery
  if (config.discoveryEnabled) {
    try {
      results.discovered = await runDiscovery({ maxProspectsPerTick: config.maxProspectsPerTick });
    } catch (err) {
      console.error('[agent-tick] discovery error:', err);
      await insertActivityEvent({
        type: 'agent_error',
        detail: `Discovery workflow error: ${err instanceof Error ? err.message : String(err)}`,
        status: 'failed',
        triggeredBy: 'agent',
      });
      results.discovered = 0;
    }
  }

  // 2. Email Outreach
  if (config.emailEnabled) {
    try {
      results.emailsSent = await runEmailOutreach({
        emailEnabled: config.emailEnabled,
        emailRatePerHour: config.emailRatePerHour,
      });
    } catch (err) {
      console.error('[agent-tick] email outreach error:', err);
      results.emailsSent = 0;
    }
  }

  // 3. Follow-up Sequencing
  if (config.emailEnabled) {
    try {
      results.followUpsSent = await runFollowUp();
    } catch (err) {
      console.error('[agent-tick] follow-up error:', err);
      results.followUpsSent = 0;
    }
  }

  // Note: site generation is intentionally NOT called in the tick since it's
  // a long-running operation. It's triggered via manual action or a dedicated
  // background queue. The workflow is available via actions/trigger.ts.

  // Record AI usage and trigger autonomous on-chain spend
  const usage = getUsage();
  const spend = await autonomousAgentSpend().catch(err => {
    console.error('[agent-tick] on-chain spend error (non-fatal):', err);
    return null;
  });

  const tick = await insertAgentTick({
    startedAt: tickStartedAt,
    discovered: results.discovered ?? 0,
    emailsSent: results.emailsSent ?? 0,
    followUpsSent: results.followUpsSent ?? 0,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    estimatedCostUsd: usage.estimatedCostUsd,
    outflowTxHash: spend?.txHash ?? undefined,
    outflowAmountUsdc: spend?.amountUsdc ?? undefined,
    status: 'completed',
  });

  if (usage.inputTokens > 0 || usage.outputTokens > 0) {
    const { recordAgenticCost } = await import('@/lib/agentic-cost');
    recordAgenticCost({
      operation: 'outreach_tick',
      entityType: 'agent_tick',
      entityId: tick.id,
      model: 'claude-sonnet-4-5',
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    }).catch((err) => console.error('[agent-tick] recordAgenticCost failed:', err));
  }

  return { skipped: false, results };
}

/**
 * Agentic cost estimation and persistence for all Anthropic SDK usage.
 * Model pricing reference (per 1M tokens): Anthropic pricing page.
 */
import { v4 as uuidv4 } from 'uuid';
import { insertAgenticCost } from '@/db/ops';
import type { AgenticCostOperation, AgenticCostEntityType } from '@/db/schema';

// $ per 1M tokens (input, output, thinking). Thinking typically billed like output.
const MODEL_RATES: Record<string, { input: number; output: number; thinking?: number }> = {
  'claude-haiku': { input: 1, output: 5, thinking: 5 },
  'claude-sonnet': { input: 3, output: 15, thinking: 15 },
  'claude-opus': { input: 5, output: 25, thinking: 25 },
};

function getRatesForModel(model: string): { input: number; output: number; thinking: number } {
  const lower = model.toLowerCase();
  for (const [prefix, rates] of Object.entries(MODEL_RATES)) {
    if (lower.includes(prefix)) {
      return {
        input: rates.input,
        output: rates.output,
        thinking: rates.thinking ?? rates.output,
      };
    }
  }
  // Default to Sonnet
  return { input: 3, output: 15, thinking: 15 };
}

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
  thinkingTokens?: number
): string {
  const rates = getRatesForModel(model);
  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;
  const thinkingCost =
    (thinkingTokens ?? 0) > 0
      ? ((thinkingTokens ?? 0) / 1_000_000) * rates.thinking
      : 0;
  const total = inputCost + outputCost + thinkingCost;
  return total.toFixed(6);
}

export interface RecordAgenticCostParams {
  operation: AgenticCostOperation;
  entityType?: AgenticCostEntityType | null;
  entityId?: string | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
  thinkingTokens?: number;
}

export async function recordAgenticCost(params: RecordAgenticCostParams): Promise<void> {
  const {
    operation,
    entityType,
    entityId,
    model,
    inputTokens,
    outputTokens,
    thinkingTokens,
  } = params;
  const estimatedCostUsd = estimateCostUsd(model, inputTokens, outputTokens, thinkingTokens);
  await insertAgenticCost({
    id: uuidv4(),
    operation,
    entityType: entityType ?? undefined,
    entityId: entityId ?? undefined,
    model,
    inputTokens,
    outputTokens,
    estimatedCostUsd,
  });
}

/** Extract usage from Anthropic Message.usage (input_tokens, output_tokens, thinking_tokens?) */
export function usageFromMessage(usage: { input_tokens: number; output_tokens: number; thinking_tokens?: number } | undefined): {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens?: number;
} | null {
  if (!usage) return null;
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    ...(usage.thinking_tokens != null && usage.thinking_tokens > 0
      ? { thinkingTokens: usage.thinking_tokens }
      : {}),
  };
}

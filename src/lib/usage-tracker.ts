/**
 * Module-level AI token usage accumulator.
 *
 * Reset at the start of each agent tick, then read at the end to record
 * the total compute cost for that tick. Thread-safe enough for Next.js
 * serverless where each invocation has its own module context.
 *
 * Pricing reference (as of 2025):
 *   claude-haiku-4-5:   $0.80 / 1M input tokens, $4.00 / 1M output tokens
 *   claude-sonnet-4-5:  $3.00 / 1M input tokens, $15.00 / 1M output tokens
 *   gemini-*:           $0.075 / 1M input tokens, $0.30 / 1M output tokens (flash)
 */

// Conservative blended rates (Sonnet pricing = worst case)
const COST_PER_M_INPUT = 3.0;
const COST_PER_M_OUTPUT = 15.0;

let _inputTokens = 0;
let _outputTokens = 0;

export function resetUsage(): void {
  _inputTokens = 0;
  _outputTokens = 0;
}

export function addUsage(inputTokens: number, outputTokens: number): void {
  _inputTokens += inputTokens;
  _outputTokens += outputTokens;
}

export function getUsage(): {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: string;
} {
  const cost =
    (_inputTokens / 1_000_000) * COST_PER_M_INPUT +
    (_outputTokens / 1_000_000) * COST_PER_M_OUTPUT;
  return {
    inputTokens: _inputTokens,
    outputTokens: _outputTokens,
    estimatedCostUsd: cost.toFixed(6),
  };
}

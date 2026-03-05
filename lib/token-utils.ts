/**
 * Lightweight token estimation utility for AI API endpoints.
 *
 * Uses a simple character-based heuristic instead of tiktoken
 * to keep the serverless bundle small and avoid native dependencies.
 *
 * Heuristic: ~3 chars per token for French text (the app is primarily French).
 * This intentionally over-estimates to stay on the safe side.
 */

/** Average characters per token for French text */
const CHARS_PER_TOKEN_FR = 3;

/** Overhead tokens per message (role name, formatting delimiters, etc.) */
const MESSAGE_OVERHEAD_TOKENS = 4;

/** Safety margin — only use 90% of the model's context window */
const SAFETY_MARGIN = 0.9;

/**
 * Known model context window sizes.
 */
export const MODEL_LIMITS: Record<string, number> = {
  'gpt-4o': 128_000,
  'gpt-4o-mini': 128_000,
};

/**
 * Estimates the number of tokens in a string using a character-count heuristic.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN_FR);
}

/**
 * Estimates total tokens for a chat completion call including all messages
 * and an optional system prompt. Adds per-message overhead for role/formatting.
 */
export function estimateMessagesTokens(
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string,
): number {
  let total = 0;

  // System prompt
  if (systemPrompt) {
    total += estimateTokens(systemPrompt) + MESSAGE_OVERHEAD_TOKENS;
  }

  // User/assistant messages
  for (const msg of messages) {
    total += estimateTokens(msg.content ?? '') + MESSAGE_OVERHEAD_TOKENS;
  }

  return total;
}

/**
 * Checks whether a request fits within the model's context window.
 *
 * @param estimatedTokens - Estimated input token count
 * @param model - Model name (key in MODEL_LIMITS)
 * @param maxOutputTokens - Reserved tokens for the model's response
 * @returns `{ ok, estimated, limit }` where `limit` is the effective limit after safety margin
 */
export function checkTokenBudget(
  estimatedTokens: number,
  model: string,
  maxOutputTokens: number,
): { ok: boolean; estimated: number; limit: number } {
  const contextWindow = MODEL_LIMITS[model];
  if (!contextWindow) {
    // Unknown model — allow the request and let the API handle it
    return { ok: true, estimated: estimatedTokens, limit: 0 };
  }

  const effectiveLimit = Math.floor(contextWindow * SAFETY_MARGIN);
  const totalRequired = estimatedTokens + maxOutputTokens;

  return {
    ok: totalRequired <= effectiveLimit,
    estimated: totalRequired,
    limit: effectiveLimit,
  };
}

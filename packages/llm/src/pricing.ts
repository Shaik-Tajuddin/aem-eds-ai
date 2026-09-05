// ============================================================
// @aeds/llm — Model Pricing Matrix
// Rates per 1M tokens (USD)
// ============================================================

interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

const PRICING_TABLE: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4o': { inputPerMillion: 2.50, outputPerMillion: 10.00 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.60 },
  'o1': { inputPerMillion: 15.00, outputPerMillion: 60.00 },
  'o3-mini': { inputPerMillion: 1.10, outputPerMillion: 4.40 },

  // Anthropic
  'claude-3-5-sonnet-20241022': { inputPerMillion: 3.00, outputPerMillion: 15.00 },
  'claude-3-7-sonnet-20250219': { inputPerMillion: 3.00, outputPerMillion: 15.00 },
  'claude-3-5-haiku-20241022': { inputPerMillion: 0.80, outputPerMillion: 4.00 },

  // Google
  'gemini-1.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.00 },
  'gemini-1.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini-2.0-flash': { inputPerMillion: 0.10, outputPerMillion: 0.40 },
  'gemini-2.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.00 },

  // Local / Self-hosted
  'ollama': { inputPerMillion: 0.0, outputPerMillion: 0.0 },
};

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const normalized = model.toLowerCase();
  const matchedKey = Object.keys(PRICING_TABLE).find((k) => normalized.includes(k.toLowerCase()));

  const rate = matchedKey ? PRICING_TABLE[matchedKey] : { inputPerMillion: 2.0, outputPerMillion: 8.0 };

  const inputCost = (inputTokens / 1_000_000) * rate.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * rate.outputPerMillion;

  return Math.round((inputCost + outputCost) * 10000) / 10000;
}

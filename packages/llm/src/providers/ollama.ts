// ============================================================
// @aeds/llm — Ollama Provider (OpenAI-compatible local API)
// ============================================================

import type { LLMProviderConfig } from '@aeds/shared';
import { OpenAIProvider } from './openai.js';

/**
 * Dedicated Ollama adapter. Uses OpenAI-compatible /v1 endpoints.
 * Default base: http://localhost:11434/v1
 */
export class OllamaProvider extends OpenAIProvider {
  public readonly name = 'ollama';

  constructor(config: LLMProviderConfig, apiKey?: string) {
    const apiUrl = normalizeOllamaUrl(config.apiUrl || process.env.LLM_API_URL || 'http://localhost:11434');
    super({ ...config, apiUrl, provider: 'ollama' }, apiKey || 'ollama');
  }

  public override isConfigured(): boolean {
    return true;
  }
}

function normalizeOllamaUrl(url: string): string {
  const trimmed = url.replace(/\/$/, '');
  if (trimmed.endsWith('/v1')) return trimmed;
  return `${trimmed}/v1`;
}

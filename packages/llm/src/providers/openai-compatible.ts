// ============================================================
// @aeds/llm — Generic OpenAI-compatible provider (OpenRouter, vLLM, etc.)
// ============================================================

import type { LLMProviderConfig } from '@aeds/shared';
import { OpenAIProvider } from './openai.js';

export class OpenAICompatibleProvider extends OpenAIProvider {
  constructor(config: LLMProviderConfig, apiKey?: string) {
    super(
      {
        ...config,
        provider: config.provider || 'openai-compatible',
      },
      apiKey,
    );
  }
}

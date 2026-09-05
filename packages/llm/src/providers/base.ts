// ============================================================
// @aeds/llm — Base Provider
// ============================================================

import type { LLMRequest, LLMResponse, LLMProviderConfig } from '@aeds/shared';

export interface ProviderChatOptions {
  timeoutMs?: number;
  abortSignal?: AbortSignal;
}

export abstract class BaseLLMProvider {
  public abstract readonly name: string;
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  public abstract chat(request: LLMRequest, options?: ProviderChatOptions): Promise<LLMResponse>;

  public abstract isConfigured(): boolean;

  public getConfig(): Readonly<LLMProviderConfig> {
    return { ...this.config };
  }
}

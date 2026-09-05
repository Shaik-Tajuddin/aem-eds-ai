// ============================================================
// @aeds/llm — LLM Gateway
// Unified entry point for all AI agents across providers
// ============================================================

import type { LLMRequest, LLMResponse, LLMProviderConfig, LLMCallRecord } from '@aeds/shared';
import { BaseLLMProvider } from './providers/base.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { GeminiProvider } from './providers/gemini.js';
import { LLMError, LLMErrorCode } from './errors.js';
import { calculateCost } from './pricing.js';

export interface LLMGatewayConfig {
  defaultProvider?: string;
  defaultModel?: string;
  providers?: LLMProviderConfig[];
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface ChatExecutionResult {
  response: LLMResponse;
  metrics: LLMCallRecord;
}

export class LLMGateway {
  private providers: Map<string, BaseLLMProvider> = new Map();
  private defaultProvider: string;
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(config?: LLMGatewayConfig) {
    this.defaultProvider = config?.defaultProvider || 'openai';
    this.maxRetries = config?.maxRetries ?? 3;
    this.retryDelayMs = config?.retryDelayMs ?? 1000;

    // Initialize configured providers
    if (config?.providers && config.providers.length > 0) {
      for (const p of config.providers) {
        this.registerProvider(p);
      }
    } else {
      // Default registrations
      this.registerProvider({ provider: 'openai', model: 'gpt-4o' });
      this.registerProvider({ provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' });
      this.registerProvider({ provider: 'gemini', model: 'gemini-1.5-pro' });
    }
  }

  public registerProvider(config: LLMProviderConfig, apiKey?: string): void {
    const providerName = config.provider.toLowerCase();
    switch (providerName) {
      case 'openai':
        this.providers.set('openai', new OpenAIProvider(config, apiKey));
        break;
      case 'anthropic':
        this.providers.set('anthropic', new AnthropicProvider(config, apiKey));
        break;
      case 'gemini':
      case 'google':
        this.providers.set('gemini', new GeminiProvider(config, apiKey));
        break;
      case 'ollama':
        this.providers.set('ollama', new OpenAIProvider({
          ...config,
          apiUrl: config.apiUrl || 'http://localhost:11434/v1',
        }, 'ollama'));
        break;
      default:
        // Assume OpenAI-compatible API
        this.providers.set(providerName, new OpenAIProvider(config, apiKey));
    }
  }

  public getProvider(providerName?: string): BaseLLMProvider {
    const target = (providerName || this.defaultProvider).toLowerCase();
    const provider = this.providers.get(target);
    if (!provider) {
      throw new LLMError(
        `LLM Provider "${target}" is not registered or supported. Available: ${Array.from(this.providers.keys()).join(', ')}`,
        LLMErrorCode.UNSUPPORTED_PROVIDER,
        target
      );
    }
    return provider;
  }

  /**
   * Resolves appropriate provider name based on model name
   */
  public resolveProviderForModel(modelName?: string): string {
    if (!modelName) return this.defaultProvider;
    const lower = modelName.toLowerCase();
    if (lower.startsWith('claude')) return 'anthropic';
    if (lower.startsWith('gemini')) return 'gemini';
    if (lower.startsWith('gpt') || lower.startsWith('o1') || lower.startsWith('o3')) return 'openai';
    return this.defaultProvider;
  }

  /**
   * Executes a chat completion with automatic retries, latency tracking, and token cost calculation.
   */
  public async executeChat(
    request: LLMRequest,
    runId = 'run_local',
    providerName?: string
  ): Promise<ChatExecutionResult> {
    const targetProviderName = providerName || this.resolveProviderForModel(request.model);
    const provider = this.getProvider(targetProviderName);

    const startTime = Date.now();
    let attempts = 0;
    let lastError: any = null;

    while (attempts < this.maxRetries) {
      attempts++;
      try {
        const response = await provider.chat(request);
        const latencyMs = Date.now() - startTime;
        const costUsd = calculateCost(response.model, response.inputTokens, response.outputTokens);

        const metrics: LLMCallRecord = {
          id: `llm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          runId,
          provider: targetProviderName,
          model: response.model,
          timestamp: new Date().toISOString(),
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          latencyMs,
          status: attempts > 1 ? 'retried' : 'success',
          estimatedCostUsd: costUsd,
        };

        return { response, metrics };
      } catch (err: any) {
        lastError = err;

        // Only retry retryable errors (429, timeouts, 5xx)
        const isRetryable =
          err.code === LLMErrorCode.RATE_LIMIT_EXCEEDED ||
          err.code === LLMErrorCode.TIMEOUT ||
          (err.status && err.status >= 500);

        if (!isRetryable || attempts >= this.maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const delay = this.retryDelayMs * Math.pow(2, attempts - 1) + Math.random() * 200;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    const latencyMs = Date.now() - startTime;
    const failedMetrics: LLMCallRecord = {
      id: `llm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      runId,
      provider: targetProviderName,
      model: request.model || 'unknown',
      timestamp: new Date().toISOString(),
      latencyMs,
      status: 'failed',
    };

    throw lastError || new LLMError('Failed after maximum retry attempts', LLMErrorCode.PROVIDER_ERROR, targetProviderName);
  }
}

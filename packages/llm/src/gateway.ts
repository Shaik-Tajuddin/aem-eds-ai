// ============================================================
// @aeds/llm — LLM Gateway
// Unified entry point for all AI agents across providers
// ============================================================

import type { LLMRequest, LLMResponse, LLMProviderConfig, LLMCallRecord } from '@aeds/shared';
import { BaseLLMProvider } from './providers/base.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { GeminiProvider } from './providers/gemini.js';
import { AzureOpenAIProvider } from './providers/azure-openai.js';
import { OllamaProvider } from './providers/ollama.js';
import { OpenAICompatibleProvider } from './providers/openai-compatible.js';
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

  private static debugEnabled(): boolean {
    const v = (process.env['LLM_DEBUG'] || '').trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes' || v === 'on';
  }

  private static truncateDebug(text: string, max = 24_000): string {
    if (text.length <= max) return text;
    return `${text.slice(0, max)}\n… [truncated ${text.length - max} chars]`;
  }

  public registerProvider(config: LLMProviderConfig, apiKey?: string): void {
    const providerName = config.provider.toLowerCase().replace(/_/g, '-');
    switch (providerName) {
      case 'openai':
        this.providers.set('openai', new OpenAIProvider(config, apiKey));
        break;
      case 'anthropic':
        this.providers.set('anthropic', new AnthropicProvider(config, apiKey));
        break;
      case 'gemini':
      case 'google':
      case 'google-gemini':
        this.providers.set('gemini', new GeminiProvider(config, apiKey));
        break;
      case 'azure':
      case 'azure-openai':
        this.providers.set('azure-openai', new AzureOpenAIProvider(config, apiKey));
        break;
      case 'ollama':
        this.providers.set('ollama', new OllamaProvider(config, apiKey));
        break;
      case 'openai-compatible':
      case 'custom':
        this.providers.set(providerName, new OpenAICompatibleProvider(config, apiKey));
        break;
      default:
        // Assume OpenAI-compatible API under the given name
        this.providers.set(providerName, new OpenAICompatibleProvider({ ...config, provider: providerName }, apiKey));
    }
  }

  /** Normalize env LLM_PROVIDER values (OPENAI, azure_openai, Ollama, …) */
  public static normalizeProviderId(raw?: string): string {
    const v = (raw || 'openai').trim().toLowerCase().replace(/_/g, '-');
    if (v === 'google' || v === 'google-gemini') return 'gemini';
    if (v === 'azure') return 'azure-openai';
    return v;
  }

  public getProvider(providerName?: string): BaseLLMProvider {
    const target = (providerName || this.defaultProvider).toLowerCase();
    const provider = this.providers.get(target);
    if (!provider) {
      throw new LLMError(
        `LLM Provider "${target}" is not registered or supported. Available: ${Array.from(this.providers.keys()).join(', ')}`,
        LLMErrorCode.UNSUPPORTED_PROVIDER,
        target,
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
    if (lower.includes('llama') || lower.includes('mistral') || lower.includes('qwen')) {
      if (this.providers.has('ollama')) return 'ollama';
    }
    return this.defaultProvider;
  }

  public listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Executes a chat completion with automatic retries, latency tracking, and token cost calculation.
   * Set LLM_DEBUG=true to print request messages + response content to the process console.
   */
  public async executeChat(
    request: LLMRequest,
    runId = 'run_local',
    providerName?: string,
  ): Promise<ChatExecutionResult> {
    const targetProviderName = providerName || this.resolveProviderForModel(request.model);
    const provider = this.getProvider(targetProviderName);
    const debug = LLMGateway.debugEnabled();

    if (debug) {
      console.log(
        `[LLM_DEBUG] ▶ request run=${runId} provider=${targetProviderName} model=${request.model || 'default'}`,
      );
      console.log(
        `[LLM_DEBUG] messages:\n${LLMGateway.truncateDebug(JSON.stringify(request.messages, null, 2))}`,
      );
    }

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

        if (debug) {
          console.log(
            `[LLM_DEBUG] ◀ response run=${runId} model=${response.model} latency=${latencyMs}ms in=${response.inputTokens} out=${response.outputTokens}`,
          );
          console.log(`[LLM_DEBUG] content:\n${LLMGateway.truncateDebug(response.content || '')}`);
          if (response.toolCalls?.length) {
            console.log(
              `[LLM_DEBUG] toolCalls:\n${LLMGateway.truncateDebug(JSON.stringify(response.toolCalls, null, 2))}`,
            );
          }
        }

        return { response, metrics };
      } catch (err: any) {
        lastError = err;
        if (debug) {
          console.error(
            `[LLM_DEBUG] ✖ attempt ${attempts}/${this.maxRetries} failed:`,
            err?.message || err,
          );
        }

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
    void failedMetrics;

    throw (
      lastError ||
      new LLMError('Failed after maximum retry attempts', LLMErrorCode.PROVIDER_ERROR, targetProviderName)
    );
  }
}

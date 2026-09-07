// ============================================================
// @aeds/llm — Azure OpenAI Provider
// ============================================================

import type { LLMRequest, LLMResponse, LLMProviderConfig, LLMToolCall } from '@aeds/shared';
import { BaseLLMProvider, type ProviderChatOptions } from './base.js';
import { LLMError, LLMErrorCode } from '../errors.js';

export class AzureOpenAIProvider extends BaseLLMProvider {
  public readonly name = 'azure-openai';
  private apiKey?: string;

  constructor(config: LLMProviderConfig, apiKey?: string) {
    super(config);
    this.apiKey = apiKey || process.env.AZURE_OPENAI_API_KEY || process.env.LLM_API_KEY;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.config.apiUrl && (this.config.azureDeployment || this.config.model));
  }

  public async chat(request: LLMRequest, options?: ProviderChatOptions): Promise<LLMResponse> {
    if (!this.isConfigured()) {
      throw new LLMError(
        'Azure OpenAI requires apiUrl, apiKey, and azureDeployment (or model).',
        LLMErrorCode.MISSING_API_KEY,
        this.name,
      );
    }

    const deployment = this.config.azureDeployment || request.model || this.config.model;
    const apiVersion = this.config.azureApiVersion || process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';
    const base = this.config.apiUrl!.replace(/\/$/, '');
    const url = `${base}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    const timeout = options?.timeoutMs || this.config.timeoutMs || 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const payload: Record<string, unknown> = {
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.role === 'tool' ? { tool_call_id: m.toolCallId } : {}),
        })),
        temperature: request.temperature ?? this.config.temperature ?? 0.2,
      };
      if (request.maxTokens ?? this.config.maxTokens) {
        payload.max_tokens = request.maxTokens ?? this.config.maxTokens;
      }
      if (request.responseFormat === 'json') {
        payload.response_format = { type: 'json_object' };
      }
      if (request.tools?.length) {
        payload.tools = request.tools.map((t) => ({
          type: 'function',
          function: { name: t.name, description: t.description, parameters: t.parameters },
        }));
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey!,
        },
        body: JSON.stringify(payload),
        signal: options?.abortSignal || controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new LLMError(
          `Azure OpenAI error (${res.status}): ${text}`,
          LLMErrorCode.PROVIDER_ERROR,
          this.name,
          res.status,
          text,
        );
      }

      const data: any = await res.json();
      const choice = data.choices?.[0];
      if (!choice) {
        throw new LLMError('Empty Azure OpenAI response', LLMErrorCode.INVALID_RESPONSE, this.name);
      }

      let toolCalls: LLMToolCall[] | undefined;
      if (choice.message?.tool_calls) {
        toolCalls = choice.message.tool_calls.map((tc: any) => {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments || '{}');
          } catch {
            args = { raw: tc.function.arguments };
          }
          return { id: tc.id, name: tc.function.name, arguments: args };
        });
      }

      return {
        content: choice.message?.content || '',
        toolCalls,
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        model: data.model || deployment,
        finishReason: choice.finish_reason || 'stop',
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new LLMError(`Azure OpenAI timed out after ${timeout}ms`, LLMErrorCode.TIMEOUT, this.name);
      }
      if (err instanceof LLMError) throw err;
      throw new LLMError(
        `Azure OpenAI request failed: ${err?.message || err}`,
        LLMErrorCode.PROVIDER_ERROR,
        this.name,
        undefined,
        err,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

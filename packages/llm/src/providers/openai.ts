// ============================================================
// @aeds/llm — OpenAI / OpenAI-Compatible Provider
// Works with OpenAI, Azure OpenAI, Ollama, vLLM
// ============================================================

import type { LLMRequest, LLMResponse, LLMProviderConfig, LLMToolCall } from '@aeds/shared';
import { BaseLLMProvider, type ProviderChatOptions } from './base.js';
import { LLMError, LLMErrorCode } from '../errors.js';

export class OpenAIProvider extends BaseLLMProvider {
  public readonly name = 'openai';
  private apiKey?: string;

  constructor(config: LLMProviderConfig, apiKey?: string) {
    super(config);
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
  }

  public isConfigured(): boolean {
    // If custom apiUrl like Ollama or local endpoint is provided, apiKey may not be required
    if (this.config.apiUrl && (this.config.apiUrl.includes('localhost') || this.config.apiUrl.includes('127.0.0.1'))) {
      return true;
    }
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  public async chat(request: LLMRequest, options?: ProviderChatOptions): Promise<LLMResponse> {
    if (!this.isConfigured()) {
      throw new LLMError(
        'OpenAI API key is missing. Please configure OPENAI_API_KEY or supply credentials.',
        LLMErrorCode.MISSING_API_KEY,
        this.name
      );
    }

    const baseUrl = this.config.apiUrl || 'https://api.openai.com/v1';
    const model = request.model || this.config.model || 'gpt-4o';
    const timeout = options?.timeoutMs || this.config.timeoutMs || 60000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const payload: Record<string, unknown> = {
        model,
        messages: request.messages.map((m) => {
          if (m.role === 'tool') {
            return {
              role: 'tool',
              tool_call_id: m.toolCallId,
              content: m.content,
            };
          }
          return {
            role: m.role,
            content: m.content,
          };
        }),
        temperature: request.temperature ?? this.config.temperature ?? 0.2,
      };

      if (request.maxTokens ?? this.config.maxTokens) {
        payload.max_tokens = request.maxTokens ?? this.config.maxTokens;
      }

      if (request.responseFormat === 'json') {
        payload.response_format = { type: 'json_object' };
      }

      if (request.tools && request.tools.length > 0) {
        payload.tools = request.tools.map((t) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }));
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: options?.abortSignal || controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorJson: any = null;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          // keep as string
        }

        const msg = errorJson?.error?.message || errorText;
        if (res.status === 401) {
          throw new LLMError('Invalid OpenAI API key', LLMErrorCode.INVALID_API_KEY, this.name, 401, msg);
        }
        if (res.status === 429) {
          throw new LLMError('OpenAI rate limit reached', LLMErrorCode.RATE_LIMIT_EXCEEDED, this.name, 429, msg);
        }
        throw new LLMError(`OpenAI API error (${res.status}): ${msg}`, LLMErrorCode.PROVIDER_ERROR, this.name, res.status, msg);
      }

      const data: any = await res.json();
      const choice = data.choices?.[0];
      if (!choice) {
        throw new LLMError('Empty response choices from OpenAI', LLMErrorCode.INVALID_RESPONSE, this.name);
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
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: args,
          };
        });
      }

      return {
        content: choice.message?.content || '',
        toolCalls,
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        model: data.model || model,
        finishReason: choice.finish_reason || 'stop',
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new LLMError(`OpenAI request timed out after ${timeout}ms`, LLMErrorCode.TIMEOUT, this.name);
      }
      if (err instanceof LLMError) throw err;
      throw new LLMError(`OpenAI request failed: ${err?.message || err}`, LLMErrorCode.PROVIDER_ERROR, this.name, undefined, err);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

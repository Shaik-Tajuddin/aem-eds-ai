// ============================================================
// @aeds/llm — Anthropic Provider
// Supports Claude 3.5 Sonnet, Claude 3.7 Sonnet, Haiku
// ============================================================

import type { LLMRequest, LLMResponse, LLMProviderConfig, LLMToolCall } from '@aeds/shared';
import { BaseLLMProvider, type ProviderChatOptions } from './base.js';
import { LLMError, LLMErrorCode } from '../errors.js';

export class AnthropicProvider extends BaseLLMProvider {
  public readonly name = 'anthropic';
  private apiKey?: string;

  constructor(config: LLMProviderConfig, apiKey?: string) {
    super(config);
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  public async chat(request: LLMRequest, options?: ProviderChatOptions): Promise<LLMResponse> {
    if (!this.isConfigured()) {
      throw new LLMError(
        'Anthropic API key is missing. Please configure ANTHROPIC_API_KEY or supply credentials.',
        LLMErrorCode.MISSING_API_KEY,
        this.name
      );
    }

    const baseUrl = this.config.apiUrl || 'https://api.anthropic.com/v1';
    const model = request.model || this.config.model || 'claude-3-5-sonnet-20241022';
    const timeout = options?.timeoutMs || this.config.timeoutMs || 60000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Anthropic requires system prompt to be passed separately from messages array
      const systemMessages = request.messages.filter((m) => m.role === 'system');
      const nonSystemMessages = request.messages.filter((m) => m.role !== 'system');

      const systemPrompt = systemMessages.map((m) => m.content).join('\n\n');

      const messages = nonSystemMessages.map((m) => {
        if (m.role === 'tool') {
          return {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: m.toolCallId,
                content: m.content,
              },
            ],
          };
        }
        return {
          role: m.role,
          content: m.content,
        };
      });

      const payload: Record<string, unknown> = {
        model,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 4096,
        messages,
        temperature: request.temperature ?? this.config.temperature ?? 0.2,
      };

      if (systemPrompt) {
        payload.system = systemPrompt;
      }

      if (request.tools && request.tools.length > 0) {
        payload.tools = request.tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters,
        }));
      }

      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
        signal: options?.abortSignal || controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorJson: any = null;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          // ignore
        }

        const msg = errorJson?.error?.message || errorText;
        if (res.status === 401) {
          throw new LLMError('Invalid Anthropic API key', LLMErrorCode.INVALID_API_KEY, this.name, 401, msg);
        }
        if (res.status === 429) {
          throw new LLMError('Anthropic rate limit reached', LLMErrorCode.RATE_LIMIT_EXCEEDED, this.name, 429, msg);
        }
        throw new LLMError(`Anthropic API error (${res.status}): ${msg}`, LLMErrorCode.PROVIDER_ERROR, this.name, res.status, msg);
      }

      const data: any = await res.json();

      let textContent = '';
      const toolCalls: LLMToolCall[] = [];

      for (const block of data.content || []) {
        if (block.type === 'text') {
          textContent += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: block.input || {},
          });
        }
      }

      return {
        content: textContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        model: data.model || model,
        finishReason: data.stop_reason || 'end_turn',
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new LLMError(`Anthropic request timed out after ${timeout}ms`, LLMErrorCode.TIMEOUT, this.name);
      }
      if (err instanceof LLMError) throw err;
      throw new LLMError(`Anthropic request failed: ${err?.message || err}`, LLMErrorCode.PROVIDER_ERROR, this.name, undefined, err);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

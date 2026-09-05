// ============================================================
// @aeds/llm — Google Gemini Provider
// Supports Gemini 1.5 Pro, 1.5 Flash, 2.0 Flash
// ============================================================

import type { LLMRequest, LLMResponse, LLMProviderConfig, LLMToolCall } from '@aeds/shared';
import { BaseLLMProvider, type ProviderChatOptions } from './base.js';
import { LLMError, LLMErrorCode } from '../errors.js';

export class GeminiProvider extends BaseLLMProvider {
  public readonly name = 'gemini';
  private apiKey?: string;

  constructor(config: LLMProviderConfig, apiKey?: string) {
    super(config);
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  public async chat(request: LLMRequest, options?: ProviderChatOptions): Promise<LLMResponse> {
    if (!this.isConfigured()) {
      throw new LLMError(
        'Gemini API key is missing. Please configure GEMINI_API_KEY or supply credentials.',
        LLMErrorCode.MISSING_API_KEY,
        this.name
      );
    }

    const model = request.model || this.config.model || 'gemini-1.5-pro';
    const timeout = options?.timeoutMs || this.config.timeoutMs || 60000;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Map OpenAI style messages to Gemini contents format
      const contents = request.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const systemMessage = request.messages.find((m) => m.role === 'system');

      const payload: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: request.temperature ?? this.config.temperature ?? 0.2,
          maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
        },
      };

      if (systemMessage) {
        payload.systemInstruction = {
          parts: [{ text: systemMessage.content }],
        };
      }

      if (request.responseFormat === 'json') {
        (payload.generationConfig as any).responseMimeType = 'application/json';
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        if (res.status === 400 && msg.includes('API_KEY_INVALID')) {
          throw new LLMError('Invalid Gemini API key', LLMErrorCode.INVALID_API_KEY, this.name, 400, msg);
        }
        if (res.status === 429) {
          throw new LLMError('Gemini rate limit exceeded', LLMErrorCode.RATE_LIMIT_EXCEEDED, this.name, 429, msg);
        }
        throw new LLMError(`Gemini API error (${res.status}): ${msg}`, LLMErrorCode.PROVIDER_ERROR, this.name, res.status, msg);
      }

      const data: any = await res.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.map((p: any) => p.text || '').join('') || '';

      const inputTokens = data.usageMetadata?.promptTokenCount || 0;
      const outputTokens = data.usageMetadata?.candidatesTokenCount || 0;

      return {
        content: text,
        inputTokens,
        outputTokens,
        model,
        finishReason: candidate?.finishReason || 'STOP',
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new LLMError(`Gemini request timed out after ${timeout}ms`, LLMErrorCode.TIMEOUT, this.name);
      }
      if (err instanceof LLMError) throw err;
      throw new LLMError(`Gemini request failed: ${err?.message || err}`, LLMErrorCode.PROVIDER_ERROR, this.name, undefined, err);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

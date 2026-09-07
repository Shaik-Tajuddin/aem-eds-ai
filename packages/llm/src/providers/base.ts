import type {
  LLMRequest,
  LLMResponse,
  LLMProviderConfig,
  LLMCapability,
  ModelCapabilities,
  StructuredLLMRequest,
  LLMEvent,
} from '@aeds/shared';

export interface ProviderChatOptions {
  timeoutMs?: number;
  abortSignal?: AbortSignal;
}

/**
 * Canonical LLM provider contract.
 * Agents must depend on this abstraction — never on a vendor SDK.
 * Named LLMProviderContract to avoid clashing with the LLMProvider enum in @aeds/shared.
 */
export interface LLMProviderContract {
  readonly name: string;
  chat(request: LLMRequest, options?: ProviderChatOptions): Promise<LLMResponse>;
  stream(request: LLMRequest, options?: ProviderChatOptions): AsyncIterable<LLMEvent>;
  generateStructured<T>(request: StructuredLLMRequest<T>, options?: ProviderChatOptions): Promise<T>;
  supports(capability: LLMCapability): boolean;
  isConfigured(): boolean;
  getConfig(): Readonly<LLMProviderConfig>;
  getCapabilities(): ModelCapabilities;
}

export abstract class BaseLLMProvider implements LLMProviderContract {
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

  public getCapabilities(): ModelCapabilities {
    return detectModelCapabilities(this.config.model, this.name);
  }

  public supports(capability: LLMCapability): boolean {
    return Boolean(this.getCapabilities()[capability]);
  }

  public async *stream(
    request: LLMRequest,
    options?: ProviderChatOptions,
  ): AsyncIterable<LLMEvent> {
    // Default adapter: non-streaming chat → single token + done
    try {
      const response = await this.chat(request, options);
      if (response.content) {
        yield { type: 'token', content: response.content };
      }
      if (response.toolCalls) {
        for (const toolCall of response.toolCalls) {
          yield { type: 'tool_call', toolCall };
        }
      }
      yield { type: 'done', response };
    } catch (err: unknown) {
      yield {
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  public async generateStructured<T>(
    request: StructuredLLMRequest<T>,
    options?: ProviderChatOptions,
  ): Promise<T> {
    const response = await this.chat(
      {
        messages: request.messages,
        model: request.model,
        maxTokens: request.maxTokens,
        temperature: request.temperature,
        responseFormat: 'json',
      },
      options,
    );
    return request.parse(response.content);
  }
}

export function detectModelCapabilities(model: string, providerName: string): ModelCapabilities {
  const m = (model || '').toLowerCase();
  const p = (providerName || '').toLowerCase();

  const vision =
    m.includes('gpt-4o') ||
    m.includes('gpt-4.1') ||
    m.includes('claude-3') ||
    m.includes('gemini') ||
    m.includes('vision') ||
    m.includes('llava');

  const longContext =
    m.includes('gpt-4.1') ||
    m.includes('claude-3') ||
    m.includes('gemini-1.5') ||
    m.includes('gemini-2') ||
    m.includes('128k') ||
    m.includes('200k');

  const toolCalling = !(p === 'ollama' && (m.includes('tiny') || m.includes('phi')));
  const streaming = true;
  const jsonMode = p !== 'ollama' || m.includes('llama3') || m.includes('qwen') || m.includes('mistral');
  const structuredOutput = jsonMode;

  return { toolCalling, structuredOutput, vision, longContext, streaming, jsonMode };
}

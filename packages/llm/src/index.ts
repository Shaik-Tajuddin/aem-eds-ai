// ============================================================
// @aeds/llm — Package Exports
// ============================================================

export { LLMGateway } from './gateway.js';
export type { LLMGatewayConfig, ChatExecutionResult } from './gateway.js';
export { BaseLLMProvider, detectModelCapabilities } from './providers/base.js';
export type { ProviderChatOptions, LLMProviderContract } from './providers/base.js';
export { OpenAIProvider } from './providers/openai.js';
export { AnthropicProvider } from './providers/anthropic.js';
export { GeminiProvider } from './providers/gemini.js';
export { AzureOpenAIProvider } from './providers/azure-openai.js';
export { OllamaProvider } from './providers/ollama.js';
export { OpenAICompatibleProvider } from './providers/openai-compatible.js';
export { LLMError, LLMErrorCode } from './errors.js';
export { calculateCost } from './pricing.js';

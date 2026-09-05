import type { LLMProvider } from '../enums/index.js';

// ============================================================
// LLM Gateway Types
// ============================================================

export interface LLMCallRecord {
  id: string;
  runId: string;
  provider: LLMProvider | string;
  model: string;
  timestamp: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  status: 'success' | 'failed' | 'retried';
  estimatedCostUsd?: number;
  // NEVER: apiKey, prompt contents, user PII
}

export interface LLMProviderConfig {
  provider: LLMProvider | string;
  apiUrl?: string;
  // apiKey stored encrypted in DB, retrieved at runtime
  model: string;
  embeddingModel?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: LLMToolDefinition[];
  responseFormat?: 'text' | 'json';
}

export interface LLMResponse {
  content: string;
  toolCalls?: LLMToolCall[];
  inputTokens: number;
  outputTokens: number;
  model: string;
  finishReason: string;
}

export interface LLMToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

// ============================================================
// Usage Summary for Dashboard
// ============================================================
export interface LLMUsageSummary {
  provider: string;
  model: string;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgLatencyMs: number;
  failedRequests: number;
  retries: number;
  estimatedCostUsd: number;
}

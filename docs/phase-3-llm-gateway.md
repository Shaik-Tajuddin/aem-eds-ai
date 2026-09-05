# Phase 3 — LLM Gateway & Multi-Provider Engine

## Overview
Phase 3 implemented `@aeds/llm`, the unified multi-provider LLM gateway supporting OpenAI, Anthropic Claude, and Google Gemini. It routes requests dynamically, handles rate limits and retries with exponential backoff, calculates token costs, and prevents API keys or PII from leaking into logs.

---

## 🛠️ Components Implemented

### 1. Multi-Provider Architecture
- **OpenAI Provider** (`src/providers/openai.ts`):
  - Uses native fetch calling `/chat/completions`.
  - Supports function/tool calling and structured JSON mode.
  - Compatible with self-hosted Ollama, vLLM, and Azure OpenAI endpoints.
- **Anthropic Provider** (`src/providers/anthropic.ts`):
  - Supports Claude 3.5 Sonnet, Claude 3.7 Sonnet, and Claude 3.5 Haiku via `/v1/messages`.
  - Maps tool definitions to `input_schema` and processes `tool_use` / `tool_result` content blocks.
- **Google Gemini Provider** (`src/providers/gemini.ts`):
  - Supports Gemini 1.5 Pro, 1.5 Flash, and Gemini 2.0 Flash via `generateContent`.
  - Maps OpenAI-style messages into Gemini `contents` and `systemInstruction`.

### 2. Intelligent Model Routing (`src/gateway.ts`)
The `LLMGateway` automatically inspects requested model names and routes requests to the optimal provider:
- `claude-*` → Anthropic Provider
- `gpt-*`, `o1`, `o3` → OpenAI Provider
- `gemini-*` → Google Gemini Provider
- Custom or local models → Configured default or Ollama provider

### 3. Token Pricing & Cost Matrix (`src/pricing.ts`)
Tracks token rates per million tokens and computes exact dollar costs for every invocation:
- `gpt-4o`: $2.50 input / $10.00 output per 1M tokens
- `gpt-4o-mini`: $0.15 input / $0.60 output per 1M tokens
- `claude-3-5-sonnet`: $3.00 input / $15.00 output per 1M tokens
- `gemini-1.5-pro`: $1.25 input / $5.00 output per 1M tokens
- `gemini-2.0-flash`: $0.10 input / $0.40 output per 1M tokens
- `ollama` (local): $0.00

### 4. Exponential Backoff & Jitter
Automatically intercepts retryable errors (HTTP 429 rate limits, network timeouts, 5xx server errors) and retries up to `maxRetries` (default: 3) using:
$$\text{delay} = \text{retryDelayMs} \times 2^{(\text{attempt}-1)} + \text{jitter}$$

### 5. Strict Credential Enforcement
Compliant with product vision: Zero mock implementations in production. If a required API key is absent, the gateway immediately fails loudly with an `LLMError` (`MISSING_API_KEY`) detailing the missing credential.

---

## 🧪 Unit Tests (`packages/llm/test/gateway.test.ts`)
7 passing tests validating cost formulas, model routing, and credential requirement enforcement.

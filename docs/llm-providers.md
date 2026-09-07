# LLM Providers

## Principle

Agents never import OpenAI/Anthropic/Gemini SDKs directly. They use `@aeds/llm` → `LLMGateway` → `BaseLLMProvider` (`LLMProviderContract`).

## Contract

```ts
interface LLMProviderContract {
  chat(request): Promise<LLMResponse>;
  stream(request): AsyncIterable<LLMEvent>;
  generateStructured<T>(request): Promise<T>;
  supports(capability: LLMCapability): boolean;
  isConfigured(): boolean;
  getCapabilities(): ModelCapabilities;
}
```

Capabilities: `toolCalling`, `structuredOutput`, `vision`, `longContext`, `streaming`, `jsonMode`.

Detection: `detectModelCapabilities(model, provider)` in `packages/llm/src/providers/base.ts`.

## Implemented providers

| ID | Class | Notes |
|---|---|---|
| `openai` | `OpenAIProvider` | Official + compatible `/v1` |
| `anthropic` | `AnthropicProvider` | Claude |
| `gemini` | `GeminiProvider` | Google Gemini |
| `azure-openai` | `AzureOpenAIProvider` | `api-key` + deployment + api-version |
| `ollama` | `OllamaProvider` | Defaults to `http://localhost:11434/v1` |
| `openai-compatible` / `custom` | `OpenAICompatibleProvider` | OpenRouter, vLLM, TokenRouter |

## Environment

```bash
LLM_PROVIDER=ollama|openai|anthropic|gemini|azure-openai|openai-compatible|custom
LLM_API_URL=
LLM_API_KEY=
LLM_MODEL=
EMBEDDING_MODEL=          # alias
LLM_EMBEDDING_MODEL=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT=
AZURE_OPENAI_API_VERSION=2024-08-01-preview
LLM_DEBUG=false
```

Orchestrator honors `LLM_PROVIDER` via `LLMGateway.normalizeProviderId()`.

## Model routing (project-configurable)

Intended mapping (gateway + project config):

| Task | Prefer |
|---|---|
| Architecture | Reasoning model |
| Coding | Coding model |
| Vision / screenshots | Vision-capable model |
| Classification | Inexpensive model |
| Private / air-gapped | Ollama |

If the selected model lacks vision, route screenshot analysis to a vision model, then pass Design Analysis JSON to the coding model.

## Observability

`LLMCallRecord` tracks provider, model, tokens, latency, estimated cost — never API keys or raw prompts in durable dashboards by default (`LLM_DEBUG` for local console only).

## Security

- Credentials stay on the API/worker process
- Never send secrets to the browser
- Never log API keys

import { describe, it, expect } from 'vitest';
import { LLMGateway, calculateCost, LLMError, detectModelCapabilities } from '../src/index.js';

describe('LLM Gateway', () => {
  describe('calculateCost', () => {
    it('calculates cost for GPT-4o correctly', () => {
      const cost = calculateCost('gpt-4o', 10000, 2000);
      expect(cost).toBe(0.045);
    });

    it('calculates cost for Claude 3.5 Sonnet correctly', () => {
      const cost = calculateCost('claude-3-5-sonnet-20241022', 100000, 10000);
      expect(cost).toBe(0.45);
    });

    it('handles zero tokens gracefully', () => {
      const cost = calculateCost('gemini-1.5-pro', 0, 0);
      expect(cost).toBe(0);
    });
  });

  describe('Model Provider Resolution', () => {
    const gateway = new LLMGateway();

    it('resolves claude models to Anthropic', () => {
      expect(gateway.resolveProviderForModel('claude-3-5-sonnet-20241022')).toBe('anthropic');
      expect(gateway.resolveProviderForModel('claude-3-7-sonnet-20250219')).toBe('anthropic');
    });

    it('resolves gemini models to Gemini', () => {
      expect(gateway.resolveProviderForModel('gemini-1.5-pro')).toBe('gemini');
      expect(gateway.resolveProviderForModel('gemini-2.0-flash')).toBe('gemini');
    });

    it('resolves gpt models to OpenAI', () => {
      expect(gateway.resolveProviderForModel('gpt-4o')).toBe('openai');
      expect(gateway.resolveProviderForModel('gpt-4o-mini')).toBe('openai');
    });

    it('normalizes provider ids from env', () => {
      expect(LLMGateway.normalizeProviderId('OPENAI')).toBe('openai');
      expect(LLMGateway.normalizeProviderId('azure_openai')).toBe('azure-openai');
      expect(LLMGateway.normalizeProviderId('GOOGLE_GEMINI')).toBe('gemini');
    });
  });

  describe('Capability detection', () => {
    it('detects vision and streaming capabilities', () => {
      const caps = detectModelCapabilities('gpt-4o', 'openai');
      expect(caps.vision).toBe(true);
      expect(caps.streaming).toBe(true);
      expect(caps.jsonMode).toBe(true);
    });
  });

  describe('Configuration & Credential Enforcement', () => {
    it('fails loudly when required API key is missing', async () => {
      const gateway = new LLMGateway({
        providers: [{ provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' }],
      });

      delete process.env.ANTHROPIC_API_KEY;

      await expect(
        gateway.executeChat({
          messages: [{ role: 'user', content: 'hello' }],
          model: 'claude-3-5-sonnet-20241022',
        }),
      ).rejects.toThrow(LLMError);
    });

    it('registers ollama provider', () => {
      const gateway = new LLMGateway({
        defaultProvider: 'ollama',
        providers: [{ provider: 'ollama', model: 'llama3.3', apiUrl: 'http://localhost:11434' }],
      });
      expect(gateway.listProviders()).toContain('ollama');
      expect(gateway.getProvider('ollama').supports('streaming')).toBe(true);
    });
  });
});

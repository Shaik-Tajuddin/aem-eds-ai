import { describe, it, expect } from 'vitest';
import { LLMGateway, calculateCost, LLMError, LLMErrorCode } from '../src/index.js';

describe('LLM Gateway', () => {
  describe('calculateCost', () => {
    it('calculates cost for GPT-4o correctly', () => {
      // 1M input = $2.50, 1M output = $10.00
      // 10,000 input = $0.025, 2,000 output = $0.02 -> total $0.045
      const cost = calculateCost('gpt-4o', 10000, 2000);
      expect(cost).toBe(0.045);
    });

    it('calculates cost for Claude 3.5 Sonnet correctly', () => {
      // 1M input = $3.00, 1M output = $15.00
      // 100,000 input = $0.30, 10,000 output = $0.15 -> total $0.45
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
  });

  describe('Configuration & Credential Enforcement', () => {
    it('fails loudly when required API key is missing', async () => {
      const gateway = new LLMGateway({
        providers: [{ provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' }],
      });

      // Explicitly unset key for test
      delete process.env.ANTHROPIC_API_KEY;

      await expect(
        gateway.executeChat({
          messages: [{ role: 'user', content: 'hello' }],
          model: 'claude-3-5-sonnet-20241022',
        })
      ).rejects.toThrow(LLMError);
    });
  });
});

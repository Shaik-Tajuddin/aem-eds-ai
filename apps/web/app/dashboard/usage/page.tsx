import type { Metadata } from 'next';
import { TopBar } from '../../../components/layout/TopBar';
import { ComingSoonPage } from '../../../components/ui/ComingSoonPage';

export const metadata: Metadata = { title: 'LLM Usage & Costs — AI EDS Developer' };

export default function UsagePage() {
  return (
    <>
      <TopBar title="LLM Usage & Token Economics" subtitle="Provider breakdowns, token metrics, latency statistics, and cost estimates" />
      <ComingSoonPage
        title="LLM Gateway Analytics"
        description="Monitor token consumption, per-model costs across OpenAI, Anthropic, and Gemini, and latency distributions per agent run."
        phase={11}
        features={[
          'Multi-provider token usage breakdown (OpenAI, Claude, Gemini)',
          'Real-time cost estimation per project and run',
          'Token rate limit and quota monitoring',
          'Prompt/completion ratio efficiency metrics',
        ]}
      />
    </>
  );
}

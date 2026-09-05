import type { Metadata } from 'next';
import { TopBar } from '../../../components/layout/TopBar';
import { ComingSoonPage } from '../../../components/ui/ComingSoonPage';

export const metadata: Metadata = { title: 'Tool Calls — AI EDS Developer' };

export default function ToolsPage() {
  return (
    <>
      <TopBar title="Tool Execution Observatory" subtitle="Real-time audit log of tool calls, sanitized inputs/outputs, and policy evaluations" />
      <ComingSoonPage
        title="Tool Calls & Policies"
        description="Inspect every tool invocation executed by autonomous agents. Verify risk level gating, approval requirements, parameter sanitization, and execution latency."
        phase={5}
        features={[
          'Complete tool invocation catalog',
          'Risk level classification (low, medium, high, critical)',
          'Policy engine evaluation logs',
          'Sanitized secrets and PII redactor audit',
          'Execution latency & timeout tracking',
        ]}
      />
    </>
  );
}

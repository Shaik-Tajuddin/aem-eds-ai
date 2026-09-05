import type { Metadata } from 'next';
import { TopBar } from '../../../components/layout/TopBar';
import { RunsManager } from '../../../components/runs/RunsManager';

export const metadata: Metadata = {
  title: 'Agent Runs — AI EDS Developer',
  description: 'Monitor, pause, resume, and inspect autonomous AI engineering pipeline runs',
};

export default function RunsPage() {
  return (
    <>
      <TopBar
        title="Autonomous Agent Runs"
        subtitle="Real-time 18-step pipeline execution, quality gate status, and state machine controls"
      />
      <div style={{ padding: '24px 32px' }}>
        <RunsManager />
      </div>
    </>
  );
}

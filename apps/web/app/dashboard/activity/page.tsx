import type { Metadata } from 'next';
import { TopBar } from '../../../components/layout/TopBar';
import { ActivityObservatory } from '../../../components/activity/ActivityObservatory';

export const metadata: Metadata = {
  title: 'AI Activity Observatory — AI EDS Developer',
  description: 'Structured stream of AI decisions, tool executions, and verified system evidence',
};

export default function ActivityPage() {
  return (
    <>
      <TopBar
        title="AI Activity Observatory"
        subtitle="Live stream of structured AI intents, plans, tool executions, and verified system evidence"
      />
      <div style={{ padding: '24px 32px' }}>
        <ActivityObservatory />
      </div>
    </>
  );
}

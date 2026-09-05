import type { Metadata } from 'next';
import { TopBar } from '../../../components/layout/TopBar';
import { QueueTelemetryDashboard } from '../../../components/queues/QueueTelemetryDashboard';

export const metadata: Metadata = {
  title: 'Queues & Workers — AI EDS Developer',
  description: 'BullMQ distributed queue telemetry, worker node observability, and real-time execution metrics',
};

export default function QueuesPage() {
  return (
    <>
      <TopBar
        title="Distributed Queues & Worker Daemons"
        subtitle="Real-time BullMQ queue health, active job concurrency, and Redis 7 cluster telemetry"
      />
      <div style={{ padding: '24px 32px' }}>
        <QueueTelemetryDashboard />
      </div>
    </>
  );
}

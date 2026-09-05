import type { Metadata } from 'next';
import { TopBar } from '../../components/layout/TopBar';
import { KPIStrip } from '../../components/dashboard/KPIStrip';
import { AttentionSection } from '../../components/dashboard/AttentionSection';
import { ActiveRunsSection } from '../../components/dashboard/ActiveRunsSection';
import { ProjectsGrid } from '../../components/dashboard/ProjectsGrid';
import { ActivityTimeline } from '../../components/dashboard/ActivityTimeline';
import { DemoBanner } from '../../components/dashboard/DemoBanner';
import {
  kpiData,
  activeRuns,
  projectCards,
  attentionItems,
  recentActivity,
} from '../../lib/demo-data';

export const metadata: Metadata = {
  title: 'Overview | AI EDS Developer',
  description: 'AI EDS Developer engineering command center',
};

export default function OverviewPage() {
  return (
    <>
      <TopBar title="Overview" subtitle="Engineering Command Center" />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxWidth: '1600px',
          width: '100%',
        }}
      >
        {/* Demo data notice */}
        <DemoBanner />

        {/* KPI Strip */}
        <KPIStrip items={kpiData} />

        {/* Attention Required */}
        {attentionItems.length > 0 && (
          <AttentionSection items={attentionItems} />
        )}

        {/* Active Agent Runs */}
        <ActiveRunsSection runs={activeRuns} />

        {/* Projects + Activity: 2-column layout on wide screens */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 380px',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <ProjectsGrid projects={projectCards} />
          <ActivityTimeline events={recentActivity} />
        </div>
      </div>
    </>
  );
}

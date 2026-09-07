'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { TopBar } from '../../components/layout/TopBar';
import { KPIStrip } from '../../components/dashboard/KPIStrip';
import { AttentionSection } from '../../components/dashboard/AttentionSection';
import { ActiveRunsSection } from '../../components/dashboard/ActiveRunsSection';
import { ProjectsGrid } from '../../components/dashboard/ProjectsGrid';
import { ActivityTimeline } from '../../components/dashboard/ActivityTimeline';
import { useProjects } from '../../lib/project-store';
import { isTerminalRunStatus, POLL_ACTIVE_MS, POLL_IDLE_MS } from '../../lib/utils';

export default function OverviewPage() {
  const { projects } = useProjects();
  const [liveRuns, setLiveRuns] = useState<any[]>([]);
  const delayRef = useRef(POLL_ACTIVE_MS);

  const loadRuns = useCallback(async (): Promise<boolean> => {
    try {
      const r = await fetch('/api/backend/runs');
      const data = await r.json();
      if (data && Array.isArray(data.runs)) {
        const mapped = data.runs.map((run: any) => {
          const progressRaw = typeof run.progress === 'number' ? run.progress : 0;
          const progress =
            progressRaw <= 1 && progressRaw > 0
              ? Math.round(progressRaw * 100)
              : Math.round(progressRaw);
          const isActive = !isTerminalRunStatus(run.status);
          return {
            id: run.id,
            projectId: run.projectId,
            projectName: run.projectName || 'EDS Project',
            status: isActive
              ? 'RUNNING'
              : run.status === 'FAILED' || run.status === 'CANCELLED'
                ? 'FAILED'
                : 'PASSED',
            source: run.source || 'EXISTING_WEBSITE',
            currentStage: run.currentStage || run.status || '—',
            stageIndex: Math.max(1, Math.round((progress / 100) * 13)),
            totalStages: 13,
            progress,
            iteration: run.iteration || 0,
            maxIterations: run.maxIterations || 5,
            durationMs: run.durationMs || 0,
            branch: run.branch || 'main',
            repo: '—',
            prUrl: undefined,
            startedAt: run.startedAt || run.createdAt || new Date().toISOString(),
          };
        });
        setLiveRuns(mapped);
        return mapped.some((run: any) => run.status === 'RUNNING');
      }
    } catch (e) {
      console.warn('Failed to load runs:', e);
    }
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const hasActive = await loadRuns();
      delayRef.current = hasActive ? POLL_ACTIVE_MS : POLL_IDLE_MS;
      if (!cancelled) {
        timer = setTimeout(tick, delayRef.current);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [loadRuns]);

  const activeCount = liveRuns.filter((r) => r.status === 'RUNNING').length;
  const kpiItems = [
    { id: 'active-runs', label: 'Active Runs', value: String(activeCount), subtext: 'in pipeline', trend: 'live' as const },
    { id: 'projects', label: 'Projects', value: String(projects.length), subtext: `${projects.length} connected`, trend: 'up' as const },
    { id: 'success-rate', label: 'Success Rate', value: '—', subtext: 'from live runs', trend: 'neutral' as const },
    { id: 'open-issues', label: 'Open Issues', value: '0', subtext: 'tracked', trend: 'neutral' as const },
    { id: 'avg-iterations', label: 'Avg Fix Iterations', value: '—', subtext: 'per run', trend: 'neutral' as const },
    { id: 'avg-runtime', label: 'Avg Run Time', value: '—', subtext: 'live', trend: 'neutral' as const },
  ];

  return (
    <>
      <TopBar title="Overview" subtitle="Engineering Command Center" onRefresh={() => void loadRuns()} />

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
        {/* Hero Section (TC-HOME-004, TC-HOME-011) */}
        <div
          id="overview-hero"
          className="card"
          style={{
            padding: '32px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'var(--color-info-dim)', borderRadius: 'var(--radius-full)', width: 'fit-content' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-info)' }}>
              Design → Code → Author → Test → Validate
            </span>
          </div>

          <div style={{ maxWidth: '840px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
              Autonomous AI Engineering for AEM Edge Delivery Services
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              From design to production-ready EDS blocks, Universal Editor instrumentation, visual regression testing, and autonomous repair loops.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <Link
              href="/dashboard/projects/new"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>+ New Project</span>
            </Link>
            <Link
              href="/dashboard/runs"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>View Recent Runs</span>
            </Link>
          </div>
        </div>

        {/* Active Agent Runs */}
        <ActiveRunsSection runs={liveRuns.filter((r) => r.status === 'RUNNING') as any} />

        {/* KPI Strip */}
        <KPIStrip items={kpiItems} />

        {/* Projects + Activity */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 380px',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <ProjectsGrid />
          <ActivityTimeline
            events={liveRuns.map((r) => ({
              id: `act-${r.id}`,
              timestamp: 'Recently',
              type: 'code',
              aiGenerated: true,
              title: `Agent pipeline executed for ${r.projectName}`,
              runId: r.id,
              project: r.projectName,
              status: r.status === 'FAILED' ? 'error' : ('success' as const),
            }))}
          />
        </div>
      </div>
    </>
  );
}

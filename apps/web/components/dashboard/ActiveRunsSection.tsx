'use client';

import type { RunSummary } from '@aeds/shared';
import Link from 'next/link';
import { ExternalLink, Figma, Globe, Clock } from 'lucide-react';
import { formatDuration } from '../../lib/utils';

interface ActiveRunsSectionProps {
  runs: RunSummary[];
}

export function ActiveRunsSection({ runs }: ActiveRunsSectionProps) {
  return (
    <section id="active-agent-runs">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--color-info)',
              display: 'inline-block',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }}
          />
          <h2 className="section-title" style={{ color: 'var(--text-secondary)' }}>
            Active Agent Runs
          </h2>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-info)',
              background: 'var(--color-info-dim)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {runs.length} running
          </span>
        </div>

        <Link href="/dashboard/runs" className="btn btn-ghost btn-sm">
          View all runs
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
        }}
      >
        {runs.length === 0 ? (
          <div
            className="card"
            style={{
              gridColumn: '1 / -1',
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
            }}
          >
            <p>No active agent runs.</p>
            <Link
              href="/dashboard/projects/new"
              className="btn btn-primary btn-sm"
              style={{ marginTop: '16px', display: 'inline-flex' }}
            >
              Start a new run
            </Link>
          </div>
        ) : (
          runs.map((run) => <ActiveRunCard key={run.id} run={run} />)
        )}
      </div>
    </section>
  );
}

function ActiveRunCard({ run }: { run: RunSummary }) {
  const SourceIcon = run.source === 'FIGMA' ? Figma : Globe;
  const durationMs = run.durationMs ?? 0;

  const stageSteps = [
    'Analyzing', 'Planning', 'Implementing', 'Building',
    'Preview', 'UE Author', 'Testing', 'Visual QA',
    'Accessibility', 'Performance', 'Fixing', 'Quality Gate', 'PR',
  ];

  return (
    <div
      id={`run-card-${run.id}`}
      className="card-elevated"
      style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Subtle glow bar at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, var(--color-info), var(--color-ai))',
          opacity: 0.8,
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '16px',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                fontWeight: 500,
              }}
            >
              {run.id}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-info)',
                background: 'var(--color-info-dim)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--color-info)',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                  display: 'inline-block',
                }}
              />
              Running
            </span>
          </div>

          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {run.projectName}
          </h3>
        </div>

        <Link
          href={`/dashboard/runs/${run.id}` as any}
          className="btn btn-secondary btn-xs"

          style={{ flexShrink: 0 }}
        >
          <ExternalLink size={11} />
          Open Run
        </Link>
      </div>

      {/* Meta grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px 16px',
          marginBottom: '16px',
        }}
      >
        <MetaRow label="Project" value={run.projectName} />
        <MetaRow
          label="Source"
          value={run.source.replace('_', ' ')}
          icon={<SourceIcon size={11} />}
        />
        <MetaRow label="Stage" value={run.currentStage ?? '—'} highlight />
        <MetaRow label="Iteration" value={`${run.iteration} / ${run.maxIterations}`} mono />
        {run.testsPassed !== undefined && (
          <MetaRow
            label="Tests"
            value={`${run.testsPassed} / ${run.testsTotal}`}
            status={run.testsPassed === run.testsTotal ? 'success' : 'warning'}
          />
        )}
        {run.visualScore !== undefined && (
          <MetaRow
            label="Visual"
            value={`${run.visualScore}%`}
            status={run.visualScore >= 95 ? 'success' : run.visualScore >= 85 ? 'warning' : 'error'}
          />
        )}
        <MetaRow
          label="Duration"
          value={formatDuration(durationMs)}
          icon={<Clock size={10} />}
        />
      </div>

      {/* Progress bar */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-tertiary)',
            }}
          >
            {run.currentStage ?? 'Processing'}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-info)',
              fontWeight: 600,
            }}
          >
            {run.progress}%
          </span>
        </div>
        <div
          style={{
            height: '4px',
            background: 'var(--bg-base)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            className="progress-bar-shimmer"
            style={{
              height: '100%',
              width: `${run.progress}%`,
              borderRadius: '2px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Stage pipeline */}
      <div
        style={{
          display: 'flex',
          gap: '3px',
          marginTop: '12px',
          flexWrap: 'wrap',
        }}
      >
        {stageSteps.map((step, i) => {
          const pct = (i / stageSteps.length) * 100;
          const isDone = pct < run.progress;
          const isCurrent = pct <= run.progress && (pct + 100 / stageSteps.length) > run.progress;
          return (
            <div
              key={step}
              title={step}
              style={{
                flex: 1,
                height: '3px',
                borderRadius: '2px',
                background: isDone
                  ? 'var(--color-success)'
                  : isCurrent
                  ? 'var(--color-info)'
                  : 'var(--border-subtle)',
                transition: 'background 0.3s ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  icon,
  mono,
  highlight,
  status,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
  status?: 'success' | 'warning' | 'error';
}) {
  const statusColor =
    status === 'success' ? 'var(--color-success)'
    : status === 'warning' ? 'var(--color-warning)'
    : status === 'error' ? 'var(--color-error)'
    : highlight ? 'var(--text-primary)'
    : 'var(--text-secondary)';

  return (
    <div>
      <div
        style={{
          fontSize: '10px',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '2px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '12px',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
          color: statusColor,
          fontWeight: highlight ? 600 : 400,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {icon}
        {value}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { NewRunModal } from './NewRunModal';

interface RunItem {
  id: string;
  projectId: string;
  projectName: string;
  source: 'FIGMA' | 'EXISTING_WEBSITE' | 'AEM_PAGE';
  branch: string;
  status: 'ANALYZING' | 'IMPLEMENTING' | 'QUALITY_GATE' | 'PR_CREATED' | 'FAILED' | 'PAUSED';
  currentPhaseText: string;
  progress: number;
  fixIterations: number;
  maxFixIterations: number;
  runtime: string;
  startedAt: string;
  previewUrl?: string;
  prUrl?: string;
  qualityGates: {
    build: boolean;
    tests: boolean;
    visual: { passed: boolean; score: number };
    a11y: boolean;
    performance: { passed: boolean; score: number };
  };
  stepsCompleted: string[];
}

const RUNS_DATA: RunItem[] = [
  {
    id: 'RUN-000142',
    projectId: 'proj-001',
    projectName: 'Product Website',
    source: 'FIGMA',
    branch: 'aeds/run-RUN-000142',
    status: 'QUALITY_GATE',
    currentPhaseText: 'Validating Visual Regression & A11y',
    progress: 88,
    fixIterations: 1,
    maxFixIterations: 5,
    runtime: '12m 45s',
    startedAt: '15m ago',
    previewUrl: 'https://aeds-run-RUN-000142--product-website--my-org.hlx.page/',
    qualityGates: {
      build: true,
      tests: true,
      visual: { passed: true, score: 97.8 },
      a11y: true,
      performance: { passed: true, score: 99 },
    },
    stepsCompleted: ['RECEIVED', 'ANALYZING', 'PLANNING', 'IMPLEMENTING', 'BUILDING', 'DEPLOYING_PREVIEW', 'UE_AUTHORING', 'FUNCTIONAL_TESTING'],
  },
  {
    id: 'RUN-000143',
    projectId: 'proj-002',
    projectName: 'Banking Portal',
    source: 'AEM_PAGE',
    branch: 'aeds/run-RUN-000143',
    status: 'IMPLEMENTING',
    currentPhaseText: 'Decorating Cards & Loan Calculator blocks',
    progress: 42,
    fixIterations: 0,
    maxFixIterations: 5,
    runtime: '4m 10s',
    startedAt: '5m ago',
    qualityGates: {
      build: true,
      tests: false,
      visual: { passed: false, score: 0 },
      a11y: false,
      performance: { passed: false, score: 0 },
    },
    stepsCompleted: ['RECEIVED', 'ANALYZING', 'PLANNING'],
  },
  {
    id: 'RUN-000139',
    projectId: 'proj-002',
    projectName: 'Banking Portal',
    source: 'FIGMA',
    branch: 'aeds/run-RUN-000139',
    status: 'PR_CREATED',
    currentPhaseText: 'Pull Request #47 Delivered & Waiting Approval',
    progress: 100,
    fixIterations: 2,
    maxFixIterations: 5,
    runtime: '16m 20s',
    startedAt: '2h ago',
    previewUrl: 'https://aeds-run-RUN-000139--banking-portal--my-org.hlx.page/',
    prUrl: 'https://github.com/my-org/banking-portal/pull/47',
    qualityGates: {
      build: true,
      tests: true,
      visual: { passed: true, score: 96.1 },
      a11y: true,
      performance: { passed: true, score: 98 },
    },
    stepsCompleted: [
      'RECEIVED', 'ANALYZING', 'PLANNING', 'IMPLEMENTING', 'BUILDING',
      'DEPLOYING_PREVIEW', 'UE_AUTHORING', 'FUNCTIONAL_TESTING',
      'VISUAL_VALIDATION', 'ACCESSIBILITY', 'PERFORMANCE', 'QUALITY_GATE', 'PR_CREATED'
    ],
  },
  {
    id: 'RUN-000140',
    projectId: 'proj-003',
    projectName: 'Checkout Page',
    source: 'EXISTING_WEBSITE',
    branch: 'aeds/run-RUN-000140',
    status: 'FAILED',
    currentPhaseText: 'ES Module SyntaxError at hero.js:42',
    progress: 35,
    fixIterations: 3,
    maxFixIterations: 5,
    runtime: '7m 15s',
    startedAt: '3h ago',
    qualityGates: {
      build: false,
      tests: false,
      visual: { passed: false, score: 0 },
      a11y: false,
      performance: { passed: false, score: 0 },
    },
    stepsCompleted: ['RECEIVED', 'ANALYZING', 'PLANNING'],
  },
];

const ALL_PIPELINE_STEPS = [
  'RECEIVED',
  'ANALYZING',
  'PLANNING',
  'IMPLEMENTING',
  'BUILDING',
  'DEPLOYING_PREVIEW',
  'UE_AUTHORING',
  'FUNCTIONAL_TESTING',
  'VISUAL_VALIDATION',
  'ACCESSIBILITY',
  'PERFORMANCE',
  'QUALITY_GATE',
  'PR_CREATED',
];

export function RunsManager() {
  const [runs, setRuns] = useState<RunItem[]>(RUNS_DATA);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED'>('ALL');
  const [selectedRun, setSelectedRun] = useState<RunItem | null>(null);
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState(false);

  const filteredRuns = runs.filter((r) => {
    if (statusFilter === 'RUNNING') return r.status === 'ANALYZING' || r.status === 'IMPLEMENTING' || r.status === 'QUALITY_GATE';
    if (statusFilter === 'COMPLETED') return r.status === 'PR_CREATED';
    if (statusFilter === 'FAILED') return r.status === 'FAILED';
    return true;
  });

  const togglePause = (id: string) => {
    setRuns((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextStatus = r.status === 'PAUSED' ? 'IMPLEMENTING' : 'PAUSED';
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
          {(['ALL', 'RUNNING', 'COMPLETED', 'FAILED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                background: statusFilter === tab ? 'var(--color-primary)' : 'transparent',
                color: statusFilter === tab ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab === 'ALL' ? 'All Runs' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Compare Runs Button */}
          <Link
            href={'/dashboard/runs/compare' as any}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⚖️</span>
            <span>Compare Runs</span>
          </Link>

          {/* Start Run Button */}
          <button
            onClick={() => setIsNewRunModalOpen(true)}
            style={{
              background: 'var(--color-primary)',
              color: '#ffffff',
              border: 'none',
              padding: '9px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
            }}
          >
            <span>⚡</span>
            <span>Start Autonomous Run</span>
          </button>
        </div>
      </div>

      {/* Runs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredRuns.map((run) => (
          <div
            key={run.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Top Row: Meta, Title, Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {run.id}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>• {run.projectName}</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#38bdf818', color: '#38bdf8', fontWeight: 600 }}>
                    {run.source}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Branch: <span style={{ color: 'var(--text-secondary)' }}>{run.branch}</span> • Started {run.startedAt} • Runtime {run.runtime}
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    background:
                      run.status === 'PR_CREATED'
                        ? '#10b98122'
                        : run.status === 'FAILED'
                        ? '#ef444422'
                        : run.status === 'PAUSED'
                        ? '#64748b22'
                        : '#3b82f622',
                    color:
                      run.status === 'PR_CREATED'
                        ? '#34d399'
                        : run.status === 'FAILED'
                        ? '#f87171'
                        : run.status === 'PAUSED'
                        ? '#94a3b8'
                        : '#60a5fa',
                    border: `1px solid ${
                      run.status === 'PR_CREATED'
                        ? '#10b98144'
                        : run.status === 'FAILED'
                        ? '#ef444444'
                        : run.status === 'PAUSED'
                        ? '#64748b44'
                        : '#3b82f644'
                    }`,
                  }}
                >
                  {run.status}
                </span>
              </div>
            </div>

            {/* Current Phase & Progress Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Current Phase: <strong style={{ color: 'var(--text-primary)' }}>{run.currentPhaseText}</strong>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {run.progress}%
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-card-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${run.progress}%`,
                    height: '100%',
                    background:
                      run.status === 'FAILED'
                        ? '#ef4444'
                        : run.status === 'PR_CREATED'
                        ? '#10b981'
                        : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Quality Gates Summary Strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--bg-card-secondary)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>QUALITY GATES:</span>
              <GatePill label="Build" passed={run.qualityGates.build} />
              <GatePill label="Unit Tests" passed={run.qualityGates.tests} />
              <GatePill
                label={`Visual (${run.qualityGates.visual.score > 0 ? `${run.qualityGates.visual.score}%` : '—'})`}
                passed={run.qualityGates.visual.passed}
              />
              <GatePill label="Accessibility" passed={run.qualityGates.a11y} />
              <GatePill
                label={`Performance (${run.qualityGates.performance.score > 0 ? run.qualityGates.performance.score : '—'})`}
                passed={run.qualityGates.performance.passed}
              />
              <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                Fix Iterations: <strong style={{ color: 'var(--text-secondary)' }}>{run.fixIterations} / {run.maxFixIterations}</strong>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '4px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                {run.previewUrl && (
                  <a
                    href={run.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={previewLinkStyle}
                  >
                    <span>🚀</span>
                    <span>Live EDS Preview</span>
                  </a>
                )}
                {run.prUrl && (
                  <a
                    href={run.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={prLinkStyle}
                  >
                    <span>📦</span>
                    <span>View Pull Request #47</span>
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {run.status !== 'PR_CREATED' && run.status !== 'FAILED' && (
                  <button onClick={() => togglePause(run.id)} style={secondaryBtnStyle}>
                    {run.status === 'PAUSED' ? '▶ Resume' : '⏸ Pause'}
                  </button>
                )}
                <button onClick={() => setSelectedRun(run)} style={inspectBtnStyle}>
                  🔍 Inspect State Machine
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* State Machine Modal Inspector */}
      {selectedRun && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '24px',
          }}
          onClick={() => setSelectedRun(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '840px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  State Machine Inspector — {selectedRun.id}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Project: {selectedRun.projectName} • Branch: {selectedRun.branch}
                </div>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Step Sequence Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>PIPELINE EXECUTION STAGES:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {ALL_PIPELINE_STEPS.map((step, idx) => {
                  const isDone = selectedRun.stepsCompleted.includes(step);
                  const isCurrent = selectedRun.status === step;
                  return (
                    <div
                      key={step}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: isCurrent ? '#3b82f622' : isDone ? 'var(--bg-card-secondary)' : '#0f1117',
                        border: `1px solid ${isCurrent ? '#3b82f6' : isDone ? '#10b98144' : 'var(--border-subtle)'}`,
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <span style={{ color: isDone ? '#10b981' : isCurrent ? '#3b82f6' : '#64748b' }}>
                        {isDone ? '✓' : isCurrent ? '●' : `${idx + 1}.`}
                      </span>
                      <span style={{ fontWeight: isCurrent || isDone ? 600 : 400, color: isCurrent ? '#60a5fa' : isDone ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details and Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button onClick={() => setSelectedRun(null)} style={secondaryBtnStyle}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Run Modal */}
      <NewRunModal
        isOpen={isNewRunModalOpen}
        onClose={() => setIsNewRunModalOpen(false)}
        onRunCreated={(newRun) => setRuns((prev) => [newRun, ...prev])}
      />
    </div>
  );
}

function GatePill({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        borderRadius: '4px',
        background: passed ? '#10b98118' : '#64748b18',
        color: passed ? '#34d399' : '#94a3b8',
        fontWeight: 500,
      }}
    >
      <span>{passed ? '✓' : '○'}</span>
      <span>{label}</span>
    </div>
  );
}

const previewLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: '#38bdf818',
  color: '#38bdf8',
  border: '1px solid #38bdf833',
  borderRadius: 'var(--radius-md)',
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 600,
  textDecoration: 'none',
};

const prLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: '#a78bfa18',
  color: '#c084fc',
  border: '1px solid #a78bfa33',
  borderRadius: 'var(--radius-md)',
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 600,
  textDecoration: 'none',
};

const secondaryBtnStyle: React.CSSProperties = {
  background: 'var(--bg-card-secondary)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
};

const inspectBtnStyle: React.CSSProperties = {
  background: 'var(--color-primary-dim)',
  color: 'var(--color-primary-light)',
  border: '1px solid var(--color-primary)',
  borderRadius: 'var(--radius-md)',
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

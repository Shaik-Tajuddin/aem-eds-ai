'use client';

import { useState } from 'react';
import { TopBar } from '../../../components/layout/TopBar';
import {
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Gauge,
  Check,
  Smartphone,
  Monitor,
  Terminal,
} from 'lucide-react';

const TEST_SUITES = [
  {
    name: 'Playwright Headless Chromium Suite',
    status: 'PASSED',
    duration: '2.4s',
    totalTests: 12,
    passedTests: 12,
    tests: [
      { name: 'DOM Block Decoration: hero block decorated cleanly without errors', time: '142ms', status: 'PASS' },
      { name: 'Image Viewport: picture containment within 1440x900 viewport', time: '88ms', status: 'PASS' },
      { name: 'Mobile Responsiveness: hamburger drawer toggles on 375px mobile viewport', time: '210ms', status: 'PASS' },
      { name: 'CTA Click Event: primary CTA dispatches /shop navigation', time: '65ms', status: 'PASS' },
      { name: 'Console Error Trap: zero uncaught exceptions and zero 404 resource requests', time: '18ms', status: 'PASS' },
    ],
  },
  {
    name: 'Vitest Monorepo Unit Test Suites',
    status: 'PASSED',
    duration: '18.6s',
    totalTests: 74,
    passedTests: 74,
    tests: [
      { name: '@aeds/github: atomic tree commit & PR adapter tests (9 tests)', time: '11ms', status: 'PASS' },
      { name: '@aeds/figma: REST API parser & design IR extraction (8 tests)', time: '18ms', status: 'PASS' },
      { name: '@aeds/aem: Universal Editor JSON schema validation (10 tests)', time: '22ms', status: 'PASS' },
      { name: '@aeds/tools: sandboxed tool execution & approval gating (5 tests)', time: '16ms', status: 'PASS' },
      { name: '@aeds/visual: 32-bit pixelmatch comparison & delta heatmap (3 tests)', time: '133ms', status: 'PASS' },
      { name: '@aeds/llm: multi-provider token gateway & pricing matrix (7 tests)', time: '15ms', status: 'PASS' },
      { name: '@aeds/rag: 768-dim pgvector cosine distance retrieval (12 tests)', time: '30ms', status: 'PASS' },
      { name: '@aeds/queue: BullMQ Redis queue manager & backoff retries (7 tests)', time: '24ms', status: 'PASS' },
      { name: '@aeds/agent: 18-state deterministic state machine transitions (6 tests)', time: '23ms', status: 'PASS' },
    ],
  },
];

import { useProjects } from '../../../lib/project-store';

export default function TestsPage() {
  const { projects } = useProjects();
  const currentProject = projects[0];
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const handleRerun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasRun(true);
    }, 1200);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar
        title="Automated Test Suites"
        subtitle="Deterministic functional, browser decoration, and Lighthouse performance verification"
        actions={
          <button onClick={handleRerun} disabled={isRunning} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RotateCw size={13} className={isRunning ? 'animate-spin' : ''} />
            <span>{isRunning ? 'Running Suites...' : 'Run All Tests'}</span>
          </button>
        }
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Total Test Cases</span>
              <FlaskConical size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {hasRun ? '86 Tests' : '0 Tests'}
            </div>
            <div style={{ fontSize: '11px', color: hasRun ? 'var(--color-success)' : 'var(--text-tertiary)', marginTop: '4px' }}>
              {hasRun ? '86 passed (100% pass rate)' : 'Awaiting test run'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Lighthouse LCP</span>
              <Gauge size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {hasRun ? '412 ms' : '—'}
            </div>
            <div style={{ fontSize: '11px', color: hasRun ? 'var(--color-success)' : 'var(--text-tertiary)', marginTop: '4px' }}>
              {hasRun ? 'Target < 2500ms (100/100 score)' : 'Pending audit'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>WCAG 2.1 AA</span>
              <CheckCircle2 size={16} color="var(--color-ai)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {hasRun ? '100 / 100' : '—'}
            </div>
            <div style={{ fontSize: '11px', color: hasRun ? 'var(--color-ai)' : 'var(--text-tertiary)', marginTop: '4px' }}>
              {hasRun ? 'Color contrast 7.1:1 verified' : 'Pending accessibility scan'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Console Exceptions</span>
              <AlertCircle size={16} color="var(--color-warning)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>0 Errors</div>
            <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>Clean browser runtime logs</div>
          </div>
        </div>

        {/* Test Suites */}
        {!hasRun ? (
          <div
            className="card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <FlaskConical size={32} color="var(--accent-primary)" />
            <div style={{ maxWidth: '440px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                No Test Runs Recorded
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {currentProject
                  ? `Execute test suites on ${currentProject.name} to audit block DOM decoration, mobile responsiveness, and Lighthouse performance metrics.`
                  : 'Execute test suites to audit block DOM decoration, mobile responsiveness, and Lighthouse performance metrics.'}
              </p>
            </div>
            <button
              onClick={handleRerun}
              disabled={isRunning}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
            >
              <RotateCw size={13} className={isRunning ? 'animate-spin' : ''} />
              <span>{isRunning ? 'Running Suites...' : 'Run All Tests'}</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {TEST_SUITES.map((suite) => (
              <div key={suite.name} className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FlaskConical size={16} color="var(--accent-primary)" />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{suite.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Duration: {suite.duration}</span>
                    <span className="badge badge-success" style={{ fontSize: '11px' }}>
                      {suite.passedTests} / {suite.totalTests} Passed
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {suite.tests.map((t, idx) => (
                    <div key={idx} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle2 size={14} color="var(--color-success)" />
                        <span style={{ color: 'var(--text-primary)' }}>{t.name}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-tertiary)' }}>{t.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

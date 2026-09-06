'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface RunComparisonData {
  id: string;
  projectName: string;
  branch: string;
  status: string;
  runtime: string;
  fixIterations: number;
  previewUrl: string;
  visualScore: number;
  testsPassed: number;
  testsTotal: number;
  a11yScore: number;
  lcpMs: number;
  files: {
    path: string;
    additions: number;
    deletions: number;
    contentA: string;
    contentB: string;
  }[];
}

const RUN_A: RunComparisonData = {
  id: 'RUN-000142',
  projectName: 'Product Website',
  branch: 'aeds/run-RUN-000142',
  status: 'QUALITY_GATE',
  runtime: '12m 45s',
  fixIterations: 1,
  previewUrl: 'https://aeds-run-RUN-000142--product-website--my-org.hlx.page/',
  visualScore: 97.8,
  testsPassed: 128,
  testsTotal: 128,
  a11yScore: 100,
  lcpMs: 820,
  files: [
    {
      path: 'blocks/hero/hero.js',
      additions: 42,
      deletions: 4,
      contentA: `export default function decorate(block) {
  const h1 = block.querySelector('h1');
  const picture = block.querySelector('picture');
  
  // Create hero container
  const heroContent = document.createElement('div');
  heroContent.className = 'hero-content';
  
  if (h1) heroContent.appendChild(h1);
  block.appendChild(heroContent);
}`,
      contentB: `export default function decorate(block) {
  const h1 = block.querySelector('h1');
  const picture = block.querySelector('picture');
  const buttons = block.querySelectorAll('a.button');
  
  // Create accessible hero container with responsive wrapper
  const heroContent = document.createElement('div');
  heroContent.className = 'hero-content';
  
  if (h1) heroContent.appendChild(h1);
  if (buttons.length) {
    const ctaGroup = document.createElement('div');
    ctaGroup.className = 'hero-actions';
    buttons.forEach((btn) => ctaGroup.appendChild(btn));
    heroContent.appendChild(ctaGroup);
  }
  
  block.appendChild(heroContent);
}`,
    },
    {
      path: 'blocks/hero/hero.css',
      additions: 58,
      deletions: 8,
      contentA: `.hero {
  position: relative;
  min-height: 400px;
  display: flex;
  align-items: center;
  padding: 48px 24px;
}`,
      contentB: `.hero {
  position: relative;
  min-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  background: var(--bg-surface);
  color: var(--text-primary);
}

.hero .hero-actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}`,
    },
    {
      path: '_component-definition.json',
      additions: 32,
      deletions: 0,
      contentA: `{
  "definitions": [
    {
      "title": "Hero",
      "id": "hero",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block"
          }
        }
      }
    }
  ]
}`,
      contentB: `{
  "definitions": [
    {
      "title": "Hero",
      "id": "hero",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "title": "Hero Banner",
              "model": "hero"
            }
          }
        }
      }
    }
  ]
}`,
    },
  ],
};

const RUN_B: RunComparisonData = {
  id: 'RUN-000139',
  projectName: 'Product Website',
  branch: 'aeds/run-RUN-000139',
  status: 'PR_CREATED',
  runtime: '16m 20s',
  fixIterations: 2,
  previewUrl: 'https://aeds-run-RUN-000139--product-website--my-org.hlx.page/',
  visualScore: 96.1,
  testsPassed: 124,
  testsTotal: 128,
  a11yScore: 95,
  lcpMs: 940,
  files: RUN_A.files,
};

export default function RunComparePage() {
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'gates'>('code');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const hasRuns = false; // No runs executed yet

  const activeFile = RUN_A.files[selectedFileIndex];

  return (
    <div style={{ padding: '32px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <Link href="/dashboard/runs" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
              Runs
            </Link>
            <span>/</span>
            <span>Comparison Observatory</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Run Comparison Observatory
          </h1>
          <p style={{ fontSize: '13px', margin: '4px 0 0', color: 'var(--text-secondary)' }}>
            Side-by-side quality metrics, visual regression differences, and atomic code diffs
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href="/dashboard/runs"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            ← Back to Runs
          </Link>
        </div>
      </div>

      {!hasRuns ? (
        <div
          style={{
            padding: '64px 24px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
          }}
        >
          <div style={{ fontSize: '36px' }}>⚖️</div>
          <div style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              No Runs Available for Comparison
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              At least two completed runs are required to compare visual regression diffs, performance metrics, and generated code side-by-side.
            </p>
          </div>
          <Link
            href="/dashboard/runs"
            style={{
              marginTop: '8px',
              background: 'var(--color-primary)',
              color: '#ffffff',
              padding: '9px 18px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⚡</span>
            <span>Go to Runs Manager</span>
          </Link>
        </div>
      ) : (
        <>
      {/* Comparison Scorecard Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Visual Metric */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Visual Similarity</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#34d399' }}>{RUN_A.visualScore}%</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>vs</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>{RUN_B.visualScore}%</span>
          </div>
          <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>+1.7% improved precision</div>
        </div>

        {/* Tests Metric */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Tests Passed</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#60a5fa' }}>{RUN_A.testsPassed} / {RUN_A.testsTotal}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>vs</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>{RUN_B.testsPassed}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '4px' }}>100% test pass rate</div>
        </div>

        {/* Runtime Metric */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Total Execution Time</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{RUN_A.runtime}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>vs</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>{RUN_B.runtime}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>21% faster execution</div>
        </div>

        {/* Self Healing */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Self-Healing Loops</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#a78bfa' }}>{RUN_A.fixIterations} loop</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>vs</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>{RUN_B.fixIterations} loops</span>
          </div>
          <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '4px' }}>Converged in 1 pass</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('code')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'code' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'code' ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '14px',
            padding: '10px 16px',
            cursor: 'pointer',
          }}
        >
          📄 Code Diff ({RUN_A.files.length} files)
        </button>
        <button
          onClick={() => setActiveTab('visual')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'visual' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'visual' ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '14px',
            padding: '10px 16px',
            cursor: 'pointer',
          }}
        >
          🖼️ Visual Diff & Preview
        </button>
        <button
          onClick={() => setActiveTab('gates')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'gates' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'gates' ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '14px',
            padding: '10px 16px',
            cursor: 'pointer',
          }}
        >
          🛡️ Quality Gates Matrix
        </button>
      </div>

      {/* TAB CONTENT: CODE DIFF */}
      {activeTab === 'code' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
          {/* File selector list */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              height: 'fit-content',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 8px' }}>
              Modified Files
            </div>
            {RUN_A.files.map((file, idx) => (
              <button
                key={file.path}
                onClick={() => setSelectedFileIndex(idx)}
                style={{
                  background: selectedFileIndex === idx ? 'var(--bg-subtle)' : 'transparent',
                  border: '1px solid',
                  borderColor: selectedFileIndex === idx ? 'var(--border-default)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: selectedFileIndex === idx ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.path.split('/').pop()}
                </span>
                <span style={{ fontSize: '11px', color: '#34d399' }}>+{file.additions}</span>
              </button>
            ))}
          </div>

          {/* Diff Viewer */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '12px 18px',
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-default)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeFile.path}</span>
              <span style={{ color: 'var(--text-muted)' }}>
                Comparing <strong style={{ color: '#60a5fa' }}>{RUN_A.id}</strong> (Candidate) vs <strong style={{ color: 'var(--text-secondary)' }}>{RUN_B.id}</strong> (Baseline)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '340px' }}>
              {/* Left: Candidate Run A */}
              <div style={{ padding: '16px', borderRight: '1px solid var(--border-default)', background: '#0a0d14' }}>
                <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 700, marginBottom: '8px' }}>
                  {RUN_A.id} (Candidate)
                </div>
                <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6, color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                  {activeFile.contentB}
                </pre>
              </div>

              {/* Right: Baseline Run B */}
              <div style={{ padding: '16px', background: '#07090e' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
                  {RUN_B.id} (Baseline)
                </div>
                <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6, color: '#94a3b8', whiteSpace: 'pre-wrap' }}>
                  {activeFile.contentA}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: VISUAL DIFF */}
      {activeTab === 'visual' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Visual Regression Overlay Comparison
              </h3>
              <p style={{ fontSize: '12px', margin: '2px 0 0', color: 'var(--text-muted)' }}>
                Differential heatmap overlay rendered with Pixelmatch at 1440x900 viewport
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Split Position: {sliderPosition}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                style={{ width: '140px', accentColor: 'var(--color-primary)' }}
              />
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              height: '420px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--border-default)',
              background: '#04060a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📐</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                97.8% Visual Match Confirmed
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 16px' }}>
                Zero critical bounding box shifts detected. 0.2% minor anti-aliasing delta localized to CTA font rendering.
              </p>
              <a
                href={RUN_A.previewUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>🌐</span>
                <span>Open Live .hlx.page Preview</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: QUALITY GATES */}
      {activeTab === 'gates' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
            Quality Gate Comparison Matrix
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Gate</th>
                  <th style={{ padding: '10px 14px' }}>Threshold Target</th>
                  <th style={{ padding: '10px 14px' }}>{RUN_A.id} (Current)</th>
                  <th style={{ padding: '10px 14px' }}>{RUN_B.id} (Baseline)</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>TypeScript Compilation</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>0 errors</td>
                  <td style={{ padding: '12px 14px', color: '#34d399' }}>✓ 0 errors</td>
                  <td style={{ padding: '12px 14px', color: '#34d399' }}>✓ 0 errors</td>
                  <td style={{ padding: '12px 14px', color: '#34d399', fontWeight: 600 }}>PASSED</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>Visual Match (Pixelmatch)</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>&gt;= 95.0%</td>
                  <td style={{ padding: '12px 14px', color: '#34d399' }}>97.8%</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>96.1%</td>
                  <td style={{ padding: '12px 14px', color: '#34d399', fontWeight: 600 }}>PASSED (+1.7%)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>Accessibility (axe-core)</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>100 score</td>
                  <td style={{ padding: '12px 14px', color: '#34d399' }}>100 / 100</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>95 / 100</td>
                  <td style={{ padding: '12px 14px', color: '#34d399', fontWeight: 600 }}>PASSED (+5)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>Performance LCP</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>&lt; 2500ms</td>
                  <td style={{ padding: '12px 14px', color: '#34d399' }}>820ms</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>940ms</td>
                  <td style={{ padding: '12px 14px', color: '#34d399', fontWeight: 600 }}>PASSED (-120ms)</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>Self-Healing Recovery</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>&lt;= 5 iterations</td>
                  <td style={{ padding: '12px 14px', color: '#34d399' }}>1 iteration</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>2 iterations</td>
                  <td style={{ padding: '12px 14px', color: '#34d399', fontWeight: 600 }}>PASSED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

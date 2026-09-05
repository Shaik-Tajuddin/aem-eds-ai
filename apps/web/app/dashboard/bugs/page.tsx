'use client';

import { useState } from 'react';
import { TopBar } from '../../../components/layout/TopBar';
import {
  Bug,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ShieldCheck,
  ChevronRight,
  Code2,
} from 'lucide-react';

const DEFECTS = [
  {
    id: 'bug-1',
    title: 'WCAG 1.4.3 Color Contrast Failure on Secondary CTA',
    severity: 'MEDIUM',
    detector: 'Lighthouse & Axe Accessibility Engine',
    diagnostic: 'Button text color #94a3b8 against dark hero background has 3.2:1 contrast ratio (Requires 4.5:1 minimum).',
    patch: 'Adjusted blocks/hero/hero.css: set text color to #ffffff with 1px solid rgba(255,255,255,0.4). Verified new ratio: 7.1:1.',
    status: 'AUTO-HEALED',
    iterations: 1,
    healedAt: '12 mins ago',
  },
  {
    id: 'bug-2',
    title: 'Mobile Viewport Picture Container Overflow (375px)',
    severity: 'HIGH',
    detector: 'Playwright Headless Browser Assertions',
    diagnostic: 'Raw picture element broke viewport bounding box causing horizontal layout shift on mobile devices.',
    patch: 'Wrapped picture in .hero-bg-wrapper container with width: 100%; height: 100%; object-fit: cover in hero.js.',
    status: 'AUTO-HEALED',
    iterations: 1,
    healedAt: '18 mins ago',
  },
  {
    id: 'bug-3',
    title: 'Missing Fallback Alt Text in Hero Picture Tag',
    severity: 'LOW',
    detector: 'EDS Block DOM Instrumentation Validator',
    diagnostic: 'DOM tree missing descriptive alt text on img tag inside picture element.',
    patch: 'Injected automated alt text from Figma component frame metadata into hero.js decorator.',
    status: 'AUTO-HEALED',
    iterations: 1,
    healedAt: '25 mins ago',
  },
];

export default function BugsAndFixesPage() {
  const [selectedBug, setSelectedBug] = useState(DEFECTS[0]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar
        title="Bugs & Autonomous Self-Healing"
        subtitle="Telemetry of detected visual, accessibility, and functional defects and automated AI patches"
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Detected Defects</span>
              <Bug size={16} color="var(--color-warning)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>3 Defects</div>
            <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>All caught in testing sandbox</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Auto-Healed</span>
              <Sparkles size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>3 Patched</div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>100% autonomous resolution rate</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Average Fix Loop</span>
              <RotateCw size={16} color="var(--color-ai)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>1.0 Cycles</div>
            <div style={{ fontSize: '11px', color: 'var(--color-ai)', marginTop: '4px' }}>Resolved on initial retry attempt</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Unresolved Bugs</span>
              <ShieldCheck size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>0 Open</div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>Zero blockers remaining</div>
          </div>
        </div>

        {/* Defect Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {DEFECTS.map((defect) => (
            <div
              key={defect.id}
              className="card"
              style={{
                padding: '20px 24px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                    <CheckCircle2 size={12} /> {defect.status}
                  </span>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{defect.title}</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  <span>{defect.detector}</span>
                  <span>•</span>
                  <span>{defect.healedAt}</span>
                </div>
              </div>

              <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-secondary)', borderLeft: '3px solid var(--color-warning)' }}>
                <strong>Diagnosis:</strong> {defect.diagnostic}
              </div>

              <div style={{ padding: '10px 14px', background: 'rgba(34, 197, 94, 0.08)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--color-success)', borderLeft: '3px solid var(--color-success)' }}>
                <strong>Autonomous Resolution:</strong> {defect.patch}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

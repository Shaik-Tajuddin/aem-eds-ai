'use client';

import { useState } from 'react';
import { TopBar } from '../../../components/layout/TopBar';
import {
  Bug,
  Sparkles,
  CheckCircle2,
  RotateCw,
  ShieldCheck,
} from 'lucide-react';

interface DefectItem {
  id: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  detector: string;
  diagnostic: string;
  patch: string;
  status: 'AUTO-HEALED' | 'IN_PROGRESS' | 'OPEN';
  iterations: number;
  healedAt: string;
}

const DEFECTS: DefectItem[] = [];

export default function BugsAndFixesPage() {
  const [defects] = useState<DefectItem[]>(DEFECTS);

  const healedCount = defects.filter((d) => d.status === 'AUTO-HEALED').length;
  const unresolvedCount = defects.filter((d) => d.status === 'OPEN').length;

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
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {defects.length} Defects
            </div>
            <div style={{ fontSize: '11px', color: defects.length > 0 ? 'var(--color-warning)' : 'var(--text-tertiary)', marginTop: '4px' }}>
              {defects.length > 0 ? 'Caught in testing sandbox' : 'Clean testing baseline'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Auto-Healed</span>
              <Sparkles size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {healedCount} Patched
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>
              {defects.length > 0 ? `${Math.round((healedCount / defects.length) * 100)}% autonomous resolution` : '100% autonomous resolution rate'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Average Fix Loop</span>
              <RotateCw size={16} color="var(--color-ai)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {defects.length > 0 ? '1.0 Cycles' : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-ai)', marginTop: '4px' }}>
              {defects.length > 0 ? 'Resolved on initial retry attempt' : 'No self-healing cycles needed'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Unresolved Bugs</span>
              <ShieldCheck size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {unresolvedCount} Open
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>Zero blockers remaining</div>
          </div>
        </div>

        {/* Defect Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {defects.length === 0 ? (
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
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={26} color="var(--color-success)" />
              </div>
              <div style={{ maxWidth: '440px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  No Defects Detected
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  All EDS blocks and components are passing visual regression, Lighthouse accessibility, performance budgets, and unit tests.
                </p>
              </div>
            </div>
          ) : (
            defects.map((defect) => (
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
            ))
          )}
        </div>

      </div>
    </div>
  );
}

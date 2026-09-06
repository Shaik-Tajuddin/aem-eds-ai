'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useProjects } from '../../lib/project-store';

export function DemoBanner() {
  const { isLiveMode, resetToDemoProjects } = useProjects();

  if (isLiveMode) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '8px 14px',
          background: 'var(--color-success-dim)',
          border: '1px solid #16a34a33',
          borderRadius: 'var(--radius-md)',
          fontSize: '12px',
          color: 'var(--color-success)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={13} />
          <span>
            LIVE MODE ACTIVE — Displaying custom projects and telemetry. Mock data disabled.
          </span>
        </div>
        <button
          onClick={resetToDemoProjects}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-success)',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Reset to Demo
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 14px',
        background: 'var(--color-warning-dim)',
        border: '1px solid #ca8a0433',
        borderRadius: 'var(--radius-md)',
        fontSize: '12px',
        color: 'var(--color-warning)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <AlertTriangle size={13} />
      <span>
        DEMO DATA — Connect a GitHub repository, AEM environment, and LLM provider in{' '}
        <a
          href="/dashboard/projects/new"
          style={{ color: 'var(--color-warning)', textDecoration: 'underline' }}
        >
          New Project
        </a>{' '}
        to see live data.
      </span>
    </div>
  );
}

'use client';

import { AlertTriangle } from 'lucide-react';

export function DemoBanner() {
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

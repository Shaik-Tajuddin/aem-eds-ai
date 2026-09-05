'use client';

import { AlertTriangle, XCircle, Eye, Search, Wrench } from 'lucide-react';
import Link from 'next/link';

interface AttentionItem {
  id: string;
  runId: string;
  projectName: string;
  type: 'accessibility' | 'build' | 'visual' | 'performance' | 'test';
  title: string;
  detail: string;
  severity: 'critical' | 'warning';
}

interface AttentionSectionProps {
  items: AttentionItem[];
}

const typeIcons = {
  accessibility: AlertTriangle,
  build: XCircle,
  visual: Eye,
  performance: AlertTriangle,
  test: XCircle,
};

export function AttentionSection({ items }: AttentionSectionProps) {
  return (
    <section id="attention-required">
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
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--color-error)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {items.length}
          </span>
          <h2
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-error)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Attention Required
          </h2>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}
      >
        {items.map((item) => (
          <AttentionCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function AttentionCard({ item }: { item: AttentionItem }) {
  const Icon = typeIcons[item.type] ?? AlertTriangle;
  const isCritical = item.severity === 'critical';

  return (
    <div
      className="attention-card"
      style={{
        background: isCritical ? 'var(--color-error-dim)' : 'var(--color-warning-dim)',
        borderColor: isCritical ? '#ef444422' : '#eab30822',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          marginBottom: '8px',
        }}
      >
        <Icon
          size={14}
          color={isCritical ? 'var(--color-error)' : 'var(--color-warning)'}
          style={{ marginTop: '1px', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
              marginBottom: '2px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {item.projectName}
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {item.title}
          </div>
        </div>
      </div>

      {/* Detail */}
      <div
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          marginBottom: '12px',
          lineHeight: 1.5,
        }}
      >
        {item.detail}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <Link
          href={`/dashboard/runs/${item.runId}` as any}
          className="btn btn-secondary btn-xs"
        >
          <Search size={11} />
          Investigate
        </Link>
        <Link
          href={`/dashboard/runs/${item.runId}` as any}
          className="btn btn-secondary btn-xs"
        >
          <Eye size={11} />
          Open Run
        </Link>

        <button
          className="btn btn-xs"
          style={{
            background: 'transparent',
            color: 'var(--color-ai)',
            border: '1px solid #7c3aed33',
          }}
          title="Ask AI to fix this issue automatically"
        >
          <Wrench size={11} />
          Let AI Fix
        </button>
      </div>
    </div>
  );
}

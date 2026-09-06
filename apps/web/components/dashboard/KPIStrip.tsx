'use client';

import { TrendingUp, TrendingDown, Minus, Radio } from 'lucide-react';

interface KPIItem {
  id: string;
  label: string;
  value: string;
  subtext?: string;
  trend: 'up' | 'down' | 'neutral' | 'live';
}

interface KPIStripProps {
  items: KPIItem[];
}


import { useProjects } from '../../lib/project-store';

export function KPIStrip({ items: initialItems }: KPIStripProps) {
  const { projects, isLiveMode } = useProjects();

  const items = isLiveMode
    ? [
        { id: 'active-runs', label: 'Active Runs', value: '0', subtext: 'READY', trend: 'live' as const },
        { id: 'projects', label: 'Projects', value: String(projects.length), subtext: 'Custom Active', trend: 'up' as const },
        { id: 'success-rate', label: 'Success Rate', value: '100%', subtext: 'Clean baseline', trend: 'up' as const },
        { id: 'open-issues', label: 'Open Issues', value: '0', subtext: 'Zero blockers', trend: 'down' as const },
        { id: 'avg-iterations', label: 'Avg Fix Iterations', value: '0.0', subtext: 'per run', trend: 'neutral' as const },
        { id: 'avg-runtime', label: 'Avg Run Time', value: '0m', subtext: 'custom runs', trend: 'neutral' as const },
      ]
    : initialItems;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '12px',
      }}
    >
      {items.map((item) => (
        <KPICard key={item.id} item={item} />
      ))}
    </div>
  );
}

function KPICard({ item }: { item: KPIItem }) {
  const trendColor =
    item.trend === 'up' ? 'var(--color-success)'
    : item.trend === 'down' ? 'var(--color-error)'
    : item.trend === 'live' ? 'var(--color-info)'
    : 'var(--text-tertiary)';

  return (
    <div
      id={`kpi-${item.id}`}
      className="card"
      style={{ padding: '16px 20px' }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: 'var(--font-mono)',
          marginBottom: '8px',
        }}
      >
        {item.label}
      </div>

      <div
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          marginBottom: '6px',
        }}
      >
        {item.value}
      </div>

      {item.subtext && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            color: trendColor,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {item.trend === 'live' && (
            <Radio size={10} style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
          )}
          {item.trend === 'up' && <TrendingUp size={10} />}
          {item.trend === 'down' && <TrendingDown size={10} />}
          {item.trend === 'neutral' && <Minus size={10} />}
          <span>{item.subtext}</span>
        </div>
      )}
    </div>
  );
}

'use client';

import { Plus, RefreshCw, Bell } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const [now, setNow] = useState<string>('');

  useEffect(() => {
    const fmt = () =>
      setNow(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        gap: '16px',
      }}
    >
      {/* Left: title */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
        <h1
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* Right: timestamp + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {now && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.05em',
            }}
          >
            {now}
          </span>
        )}

        <button
          className="btn btn-ghost btn-sm"
          title="Refresh"
          aria-label="Refresh data"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={13} />
        </button>

        <button
          className="btn btn-ghost btn-sm"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell size={13} />
        </button>

        {actions}

        <Link
          href="/dashboard/projects/new"
          className="btn btn-primary btn-sm"
          id="new-project-cta"
        >
          <Plus size={13} />
          New Project
        </Link>
      </div>
    </header>
  );
}

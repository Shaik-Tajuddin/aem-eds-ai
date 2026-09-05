'use client';

import Link from 'next/link';
import { Construction, ArrowRight } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  description: string;
  phase: number;
  features?: string[];
  actionLabel?: string;
  actionHref?: string;
}

export function ComingSoonPage({
  title,
  description,
  phase,
  features,
  actionLabel,
  actionHref,
}: ComingSoonPageProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}
    >
      <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
        {/* Phase badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--color-info-dim)',
            border: '1px solid #2563eb22',
            marginBottom: '24px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-info)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <Construction size={12} />
          Phase {phase}
        </div>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '12px',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginBottom: '32px',
          }}
        >
          {description}
        </p>

        {features && features.length > 0 && (
          <div
            className="card"
            style={{ padding: '20px 24px', textAlign: 'left', marginBottom: '24px' }}
          >
            <div className="section-title" style={{ marginBottom: '12px' }}>
              Planned features
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {features.map((f) => (
                <li
                  key={f}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: 'var(--accent-primary)',
                      flexShrink: 0,
                    }}
                  />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {actionLabel && actionHref && (
          <Link href={actionHref as any} className="btn btn-primary">

            {actionLabel}
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}

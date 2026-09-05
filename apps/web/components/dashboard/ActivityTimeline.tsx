'use client';

import Link from 'next/link';
import {
  Wrench, Eye, FlaskConical, Code2, Activity, GitPullRequest,
  AlertTriangle, CheckCircle2, XCircle, Zap,
} from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils';

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: string;
  aiGenerated: boolean;
  title: string;
  runId: string;
  project: string;
  status: 'success' | 'error' | 'warning' | 'info';
}

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

const typeIcons: Record<string, React.ElementType> = {
  fix:      Wrench,
  visual:   Eye,
  test:     FlaskConical,
  code:     Code2,
  analysis: Activity,
  pr:       GitPullRequest,
  build:    AlertTriangle,
  ue:       Zap,
};

const statusColors: Record<string, string> = {
  success: 'var(--color-success)',
  error:   'var(--color-error)',
  warning: 'var(--color-warning)',
  info:    'var(--color-info)',
};

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <section id="recent-activity">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <h2 className="section-title">Recent Activity</h2>
        <Link href="/dashboard/activity" className="btn btn-ghost btn-sm">
          View all
        </Link>
      </div>

      <div
        className="card"
        style={{ overflow: 'hidden' }}
      >
        {events.map((event, index) => (
          <EventRow
            key={event.id}
            event={event}
            isLast={index === events.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function EventRow({
  event,
  isLast,
}: {
  event: ActivityEvent;
  isLast: boolean;
}) {
  const Icon = typeIcons[event.type] ?? Activity;
  const statusColor = statusColors[event.status] ?? 'var(--color-info)';

  return (
    <Link
      href={`/dashboard/runs/${event.runId}` as any}
      style={{

        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '10px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background 0.1s ease',
      }}
      className="activity-row"
    >
      {/* Icon */}
      <div
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${statusColor} 25%, transparent)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        {event.status === 'success' ? (
          <CheckCircle2 size={12} color={statusColor} />
        ) : event.status === 'error' ? (
          <XCircle size={12} color={statusColor} />
        ) : (
          <Icon size={12} color={statusColor} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '2px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-primary)',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.title}
          </span>
          {event.aiGenerated && (
            <span className="ai-badge">AI</span>
          )}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {event.project}
        </div>
      </div>

      {/* Timestamp */}
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {formatRelativeTime(event.timestamp)}
      </div>
    </Link>
  );
}

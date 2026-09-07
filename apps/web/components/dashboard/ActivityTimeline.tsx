'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wrench, Eye, FlaskConical, Code2, Activity, GitPullRequest,
  AlertTriangle, CheckCircle2, XCircle, Zap, ChevronDown, ChevronUp,
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
  /** Items shown when minimized (default 5) */
  collapsedCount?: number;
}

const COLLAPSED_STORAGE_KEY = 'aeds.dashboard.activity.expanded';

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

export function ActivityTimeline({ events, collapsedCount = 5 }: ActivityTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_STORAGE_KEY);
      if (stored === '1') setExpanded(true);
    } catch {
      // ignore
    }
  }, []);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  const canToggle = events.length > collapsedCount;
  const visibleEvents = expanded || !canToggle ? events : events.slice(0, collapsedCount);
  const hiddenCount = Math.max(0, events.length - collapsedCount);

  return (
    <section id="recent-activity">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          gap: '8px',
        }}
      >
        <h2 className="section-title" style={{ margin: 0 }}>
          Recent Activity
          {events.length > 0 && (
            <span
              style={{
                marginLeft: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--text-tertiary)',
              }}
            >
              {events.length}
            </span>
          )}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {canToggle && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={toggleExpanded}
              aria-expanded={expanded}
              title={expanded ? 'Minimize activity list' : 'Expand activity list'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{expanded ? 'Minimize' : 'Expand'}</span>
            </button>
          )}
          <Link href="/dashboard/activity" className="btn btn-ghost btn-sm">
            View all
          </Link>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {events.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: '13px',
            }}
          >
            No recent activity recorded yet
          </div>
        ) : (
          <>
            {visibleEvents.map((event, index) => (
              <EventRow
                key={event.id}
                event={event}
                isLast={index === visibleEvents.length - 1 && !(!expanded && canToggle)}
              />
            ))}
            {canToggle && !expanded && (
              <button
                type="button"
                onClick={toggleExpanded}
                style={{
                  width: '100%',
                  border: 'none',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  padding: '10px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ChevronDown size={14} />
                Show {hiddenCount} more
              </button>
            )}
            {canToggle && expanded && (
              <button
                type="button"
                onClick={toggleExpanded}
                style={{
                  width: '100%',
                  border: 'none',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  padding: '10px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ChevronUp size={14} />
                Minimize
              </button>
            )}
          </>
        )}
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
          {event.aiGenerated && <span className="ai-badge">AI</span>}
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

'use client';

import Link from 'next/link';
import { CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils';
import { useProjects } from '../../lib/project-store';

interface ProjectCard {
  id: string;
  name: string;
  health: 'HEALTHY' | 'ISSUES' | 'DEGRADED' | 'UNKNOWN';
  activeRuns: number;
  eds: boolean;
  aem: boolean;
  ue: boolean;
  testsTotal: number;
  testsPassed: number;
  visualScore?: number;
  lastRunAt?: string;
}

interface ProjectsGridProps {
  projects?: ProjectCard[];
}

export function ProjectsGrid({ projects: initialProjects = [] }: ProjectsGridProps) {
  const { projects: storedProjects } = useProjects();

  const displayProjects: ProjectCard[] = storedProjects.length > 0
    ? storedProjects.map((p) => ({
        id: p.id,
        name: p.name,
        health: p.healthScore > 90 ? 'HEALTHY' : 'ISSUES',
        activeRuns: p.lastRunStatus === 'RUNNING' ? 1 : 0,
        eds: true,
        aem: !!p.aemEnvironment,
        ue: true,
        testsTotal: p.blocksCount > 0 ? p.blocksCount * 8 : 0,
        testsPassed: p.blocksCount > 0 ? p.blocksCount * 8 : 0,
        visualScore: p.healthScore,
        lastRunAt: p.lastRunTime,
      }))
    : initialProjects;

  return (
    <section id="projects">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <h2 className="section-title">Projects</h2>
        <Link href="/dashboard/projects" className="btn btn-ghost btn-sm">
          View all
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayProjects.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', margin: 0 }}>
              No EDS projects connected yet.
            </p>
            <Link
              href="/dashboard/projects/new"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Connect First Project</span>
            </Link>
          </div>
        ) : (
          displayProjects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))
        )}
      </div>
    </section>
  );
}

function ProjectRow({ project }: { project: ProjectCard }) {
  const isHealthy = project.health === 'HEALTHY';
  const healthColor = isHealthy ? 'var(--color-success)' : 'var(--color-warning)';

  return (
    <div
      id={`project-${project.id}`}
      className="card"
      style={{ padding: '14px 18px' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Left: name + health */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: healthColor,
              flexShrink: 0,
              ...(project.activeRuns > 0 && {
                animation: 'pulse-dot 2s ease-in-out infinite',
              }),
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project.name}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: healthColor,
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
              }}
            >
              {isHealthy ? '✓ Healthy' : '⚠ Issues'}
              {project.activeRuns > 0 && (
                <span style={{ color: 'var(--color-info)', marginLeft: '8px' }}>
                  {project.activeRuns} active run{project.activeRuns > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle: service status */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ServiceBadge label="EDS" ok={project.eds} />
          <ServiceBadge label="AEM" ok={project.aem} />
          <ServiceBadge label="UE" ok={project.ue} />
        </div>

        {/* Metrics */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Metric
            label="Tests"
            value={`${project.testsPassed}/${project.testsTotal}`}
            ok={project.testsPassed === project.testsTotal}
          />
          {project.visualScore !== undefined && (
            <Metric
              label="Visual"
              value={`${project.visualScore}%`}
              ok={project.visualScore >= 95}
            />
          )}
          {project.lastRunAt && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
              }}
            >
              <Clock size={10} />
              {formatRelativeTime(project.lastRunAt)}
            </div>
          )}
        </div>

        {/* Action */}
        <Link
          href={`/dashboard/projects/${project.id}` as any}
          className="btn btn-secondary btn-xs"

          style={{ flexShrink: 0 }}
        >
          <ExternalLink size={11} />
          Open
        </Link>
      </div>
    </div>
  );
}

function ServiceBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      title={`${label}: ${ok ? 'connected' : 'not configured'}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '10px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        color: ok ? 'var(--color-success)' : 'var(--text-disabled)',
        padding: '2px 6px',
        borderRadius: 'var(--radius-sm)',
        background: ok ? 'var(--color-success-dim)' : 'transparent',
        border: `1px solid ${ok ? '#22c55e22' : 'var(--border-subtle)'}`,
      }}
    >
      {ok ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
      {label}
    </div>
  );
}

function Metric({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div
        style={{
          fontSize: '10px',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: ok ? 'var(--color-success)' : 'var(--color-warning)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

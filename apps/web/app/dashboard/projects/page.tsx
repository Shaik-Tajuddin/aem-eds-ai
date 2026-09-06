'use client';

import Link from 'next/link';
import { TopBar } from '../../../components/layout/TopBar';
import {
  FolderKanban,
  Plus,
  GitBranch,
  Github,
  CheckCircle2,
  ExternalLink,
  Play,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useProjects } from '../../../lib/project-store';

export default function ProjectsPage() {
  const { projects } = useProjects();
  const totalBlocks = projects.reduce((acc, p) => acc + (p.blocksCount || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar
        title="EDS Projects"
        subtitle="Manage connected GitHub repositories, AEM environments, LLM configurations, and quality gate profiles"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/dashboard/projects/new" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} />
              <span>New Project</span>
            </Link>
          </div>
        }
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Projects</span>
              <FolderKanban size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {projects.length} {projects.length === 1 ? 'Repo' : 'Repos'}
            </div>
            <div style={{ fontSize: '11px', color: projects.length > 0 ? 'var(--color-success)' : 'var(--text-tertiary)', marginTop: '4px' }}>
              {projects.length > 0 ? `${projects.length} connected repositories` : 'No connected repositories'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connected Blocks</span>
              <Layers size={16} color="var(--color-ai)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{totalBlocks} Blocks</div>
            <div style={{ fontSize: '11px', color: 'var(--color-ai)', marginTop: '4px' }}>Universal Editor contracts active</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quality Gate Average</span>
              <CheckCircle2 size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {projects.length > 0 ? '100%' : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>
              {projects.length > 0 ? 'LCP < 500ms, WCAG AA pass' : 'Awaiting initial run'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Self-Healing Rate</span>
              <Sparkles size={16} color="var(--color-warning)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {projects.length > 0 ? '100%' : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>
              {projects.length > 0 ? 'Zero human intervention required' : 'Awaiting initial run'}
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Connected Projects & Environments</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Showing {projects.length} of {projects.length} projects</span>
          </div>

          {projects.length === 0 ? (
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
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FolderKanban size={24} color="var(--accent-primary)" />
              </div>
              <div style={{ maxWidth: '420px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  No Connected Projects
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Connect your GitHub repository, AEM environment, and LLM configuration to begin modernizing blocks and managing autonomous runs.
                </p>
              </div>
              <Link
                href="/dashboard/projects/new"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}
              >
                <Plus size={14} />
                <span>Create New Project</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    padding: '20px 24px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: 'var(--radius-md)',
                          background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(168,85,247,0.2))',
                          border: '1px solid rgba(59,130,246,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Github size={18} color="var(--accent-primary)" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</h3>
                          <span className="badge badge-success" style={{ fontSize: '11px' }}>Active</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          <span>{p.repo}</span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <GitBranch size={12} /> {p.branch}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Link href="/dashboard/runs" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Play size={12} />
                        <span>Trigger Run</span>
                      </Link>
                      <Link href={`https://github.com/${p.repo}`} target="_blank" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ExternalLink size={12} />
                        <span>GitHub</span>
                      </Link>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>AEM Environment</span>
                      <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{p.aemEnvironment}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>AEM Authoring Path</span>
                      <span style={{ color: p.aemAuthoringPath ? 'var(--accent-primary)' : 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {p.aemAuthoringPath ? (
                          p.aemAuthorUrl ? (
                            <a
                              href={`${p.aemAuthorUrl.replace(/\/$/, '')}/sites.html${p.aemAuthoringPath.startsWith('/') ? p.aemAuthoringPath : `/${p.aemAuthoringPath}`}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              {p.aemAuthoringPath} <ExternalLink size={10} />
                            </a>
                          ) : (
                            p.aemAuthoringPath
                          )
                        ) : (
                          '— (Document-based)'
                        )}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Primary LLM</span>
                      <span style={{ color: 'var(--text-primary)' }}>{p.llmProvider}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Authored Blocks</span>
                      <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{p.blocksCount} Blocks</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Last Run Health</span>
                      <span style={{ color: 'var(--color-success)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{p.lastRunStatus} ({p.lastRunTime})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

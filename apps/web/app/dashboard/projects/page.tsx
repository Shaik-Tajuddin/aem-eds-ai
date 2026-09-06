'use client';

import Link from 'next/link';
import { TopBar } from '../../../components/layout/TopBar';
import {
  FolderKanban,
  Plus,
  GitBranch,
  Github,
  Globe,
  CheckCircle2,
  ExternalLink,
  Play,
  Settings2,
  Sparkles,
  Layers,
} from 'lucide-react';

const PROJECTS = [
  {
    id: 'proj-1',
    name: 'AEDS Core Boilerplate',
    repo: 'adobe-experience-league/aeds-boilerplate',
    branch: 'main',
    aemEnvironment: 'aem-stage-east.adobeaemcloud.com',
    llmProvider: 'Claude 3.7 Sonnet (Hybrid)',
    blocksCount: 12,
    lastRunStatus: 'PASSED',
    lastRunTime: '18 mins ago',
    healthScore: 99,
  },
  {
    id: 'proj-2',
    name: 'WKND Brand & Commerce EDS',
    repo: 'adobe-marketing/wknd-eds-storefront',
    branch: 'preview',
    aemEnvironment: 'wknd-prod.adobeaemcloud.com',
    llmProvider: 'OpenAI GPT-4o',
    blocksCount: 8,
    lastRunStatus: 'PASSED',
    lastRunTime: '2 hours ago',
    healthScore: 98,
  },
  {
    id: 'proj-3',
    name: 'Universal Design System Library',
    repo: 'adobe-design/eds-design-tokens',
    branch: 'develop',
    aemEnvironment: 'design-preview.adobeaemcloud.com',
    llmProvider: 'Ollama Llama 3.3 (Local)',
    blocksCount: 24,
    lastRunStatus: 'PASSED',
    lastRunTime: '5 hours ago',
    healthScore: 100,
  },
];

import { useProjects } from '../../../lib/project-store';

export default function ProjectsPage() {
  const { projects, isLiveMode, resetToDemoProjects } = useProjects();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar
        title="EDS Projects"
        subtitle="Manage connected GitHub repositories, AEM environments, LLM configurations, and quality gate profiles"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isLiveMode && (
              <button
                onClick={resetToDemoProjects}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}
              >
                Reset to Demo
              </button>
            )}
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
            <div style={{ fontSize: '11px', color: isLiveMode ? 'var(--color-success)' : 'var(--accent-primary)', marginTop: '4px' }}>
              {isLiveMode ? 'Custom Projects Active' : '100% EDS boilerplate compliant'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connected Blocks</span>
              <Layers size={16} color="var(--color-ai)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>44 Blocks</div>
            <div style={{ fontSize: '11px', color: 'var(--color-ai)', marginTop: '4px' }}>Universal Editor contracts active</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quality Gate Average</span>
              <CheckCircle2 size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>99.2%</div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>LCP &lt; 500ms, WCAG AA pass</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Self-Healing Rate</span>
              <Sparkles size={16} color="var(--color-warning)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>100%</div>
            <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>Zero human intervention required</div>
          </div>
        </div>

        {/* Projects List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Connected Projects & Environments</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Showing {projects.length} of {projects.length} projects</span>
          </div>

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
        </div>

      </div>
    </div>
  );
}

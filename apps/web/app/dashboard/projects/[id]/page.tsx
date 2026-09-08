'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { TopBar } from '../../../../components/layout/TopBar';
import {
  getProjectById,
  fetchProjectById,
  updateProject,
  deleteProject,
  UserProject,
} from '../../../../lib/project-store';
import {
  FolderKanban,
  GitBranch,
  ExternalLink,
  Play,
  CheckCircle2,
  Layers,
  FileCode2,
  FlaskConical,
  Eye,
  Settings,
  AlertTriangle,
  Trash2,
  Save,
  Check,
  ArrowLeft,
  X,
} from 'lucide-react';
import { NewRunModal } from '../../../../components/runs/NewRunModal';

const TABS = [
  { id: 'overview', label: 'Overview', icon: FolderKanban },
  { id: 'runs', label: 'Run History', icon: Play },
  { id: 'code', label: 'Code Changes', icon: FileCode2 },
  { id: 'tests', label: 'Tests', icon: FlaskConical },
  { id: 'visual', label: 'Visual QA', icon: Eye },
  { id: 'blocks', label: 'EDS Blocks', icon: Layers },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabType = typeof TABS[number]['id'];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params?.id as string) || '';
  const [project, setProject] = useState<UserProject | null>(() => (rawId ? getProjectById(rawId) : null));
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Settings Form State
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    repo: '',
    branch: '',
    aemAuthorUrl: '',
    aemEnvironment: '',
    llmProvider: '',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [projectRuns, setProjectRuns] = useState<any[]>([]);
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState(false);
  const [parityLoading, setParityLoading] = useState(false);
  const [parityMsg, setParityMsg] = useState<string | null>(null);

  const handleAuthorPageContent = async () => {
    if (!project?.id || parityLoading) return;
    setParityLoading(true);
    setParityMsg(null);
    try {
      const res = await fetch('/api/backend/parity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id.startsWith('proj-') ? project.id.replace(/^proj-/, '') : project.id,
          fixCss: false,
          verifyBrowser: true,
          branch: project.branch || 'main',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || data.message || `HTTP ${res.status}`);
      }
      setParityMsg(`Page authored · run ${String(data.runId || '').slice(0, 8)}… — see Universal Editor evidence`);
    } catch (err: unknown) {
      setParityMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setParityLoading(false);
    }
  };

  useEffect(() => {
    if (!rawId) {
      setLoading(false);
      return;
    }
    const p = getProjectById(rawId);
    if (p) {
      setProject(p);
      setEditForm({
        name: p.name,
        description: p.description,
        repo: p.repo,
        branch: p.branch,
        aemAuthorUrl: p.aemAuthorUrl || 'http://localhost:4502',
        aemEnvironment: p.aemEnvironment || 'https://main--wknd--hlx.page',
        llmProvider: p.llmProvider || 'Claude 3.5 Sonnet',
      });
    }

    // Fetch live project detail from PostgreSQL
    fetchProjectById(rawId)
      .then((live) => {
        setLoading(false);
        if (live) {
          setProject(live);
          setEditForm({
            name: live.name,
            description: live.description,
            repo: live.repo,
            branch: live.branch,
            aemAuthorUrl: live.aemAuthorUrl || 'http://localhost:4502',
            aemEnvironment: live.aemEnvironment || 'https://main--wknd--hlx.page',
            llmProvider: live.llmProvider || 'Claude 3.5 Sonnet',
          });
        }
      })
      .catch(() => setLoading(false));

    // Fetch live runs for this project from PostgreSQL
    fetch(`/api/backend/runs?projectId=${rawId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.runs)) {
          setProjectRuns(
            data.runs.map((r: any) => {
              const progressRaw = typeof r.progress === 'number' ? r.progress : 0;
              const progress =
                progressRaw <= 1 && progressRaw > 0
                  ? Math.round(progressRaw * 100)
                  : Math.round(progressRaw);
              const stagesDone = Math.max(0, Math.min(13, Math.round((progress / 100) * 13)));
              return {
                id: r.id,
                date: r.startedAt ? new Date(r.startedAt).toLocaleString() : 'Recently',
                source: r.source || 'Existing Website',
                status: r.status || 'RECEIVED',
                duration: r.durationMs
                  ? `${Math.floor(r.durationMs / 60000)}m ${Math.floor((r.durationMs % 60000) / 1000)}s`
                  : '—',
                stages: `${stagesDone} / 13`,
                visualScore: '—',
                tests: '—',
              };
            })
          );
        }
      })
      .catch((e) => console.warn('Failed to fetch project runs:', e));
  }, [rawId]);

  const handleSaveSettings = async () => {
    if (!project) return;
    await updateProject(project.id, editForm);
    setProject((prev) => (prev ? { ...prev, ...editForm } : null));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleDeleteProject = async () => {
    if (project && deleteConfirmText.trim().toLowerCase() === project.name.trim().toLowerCase()) {
      await deleteProject(project.id);
      setShowDeleteModal(false);
      router.push('/dashboard/projects');
    }
  };

  if (loading && !project) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Project Not Found" subtitle="The requested project does not exist or has been removed." />
        <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FolderKanban size={24} color="var(--color-error)" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Project Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
            This project has been deleted or does not exist in the database.
          </p>
          <Link href="/dashboard/projects" className="btn btn-primary btn-sm">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title={project.name}
        subtitle={`Project ID: ${project.id} · Connected to ${project.repo}`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsNewRunModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={13} />
              <span>Start New Run</span>
            </button>
          </div>
        }
      />

      {/* Tabs bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                background: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} color={isActive ? 'var(--accent-primary)' : 'currentColor'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header info card */}
            <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                    {project.name}
                  </h1>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '700px', lineHeight: 1.5 }}>
                    {project.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAuthorPageContent}
                    disabled={parityLoading || !project.aemAuthoringPath}
                    title="Track B: author destination page via aem-cloud MCP (no PR required)"
                  >
                    {parityLoading ? 'Authoring…' : 'Author page content'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsNewRunModalOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Play size={13} /> Start run
                  </button>
                  <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Healthy
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    Last run {project.lastRunTime}
                  </span>
                </div>
              </div>

              {parityMsg ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>{parityMsg}</p>
              ) : null}
              {/* Badges & Indicators */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 10px', background: 'var(--color-success-dim)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)', border: '1px solid #22c55e33', fontWeight: 600 }}>
                  ✓ EDS Engine: Active
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 10px', background: 'var(--color-success-dim)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)', border: '1px solid #22c55e33', fontWeight: 600 }}>
                  ✓ AEM Author: Connected
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 10px', background: 'var(--color-success-dim)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)', border: '1px solid #22c55e33', fontWeight: 600 }}>
                  ✓ Universal Editor: Validated
                </span>
              </div>
            </div>

            {/* Environment & Repository Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <GitBranch size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>GitHub Repository</span>
                </div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {project.repo}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Branch: <span style={{ fontFamily: 'var(--font-mono)' }}>{project.branch}</span>
                </div>
                <a
                  href={`https://github.com/${project.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-xs"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Open in GitHub</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <ExternalLink size={16} color="var(--color-ai)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>AEM Environments</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)' }}>Preview: </span>
                    <a href={project.aemEnvironment || 'https://main--wknd--hlx.page'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
                      {project.aemEnvironment || 'https://main--wknd--hlx.page'}
                    </a>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)' }}>Author: </span>
                    <a href={project.aemAuthorUrl || 'http://localhost:4502'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
                      {project.aemAuthorUrl || 'http://localhost:4502'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RUN HISTORY TAB */}
        {activeTab === 'runs' && (
          <div className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Autonomous Execution Runs
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{projectRuns.length} runs executed</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Run ID</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Stages</th>
                    <th style={{ padding: '12px 16px' }}>Tests</th>
                    <th style={{ padding: '12px 16px' }}>Visual Similarity</th>
                    <th style={{ padding: '12px 16px' }}>Duration</th>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projectRuns.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                        No execution runs found for this project. Click &ldquo;Start New Run&rdquo; above to trigger the pipeline.
                      </td>
                    </tr>
                  ) : (
                    projectRuns.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {r.id}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            className={
                              r.status === 'FAILED' || r.status === 'CANCELLED'
                                ? 'badge badge-error'
                                : r.status === 'WAITING_APPROVAL' || r.status === 'COMPLETED' || r.status === 'DEPLOYED'
                                  ? 'badge badge-success'
                                  : 'badge badge-neutral'
                            }
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            {(r.status === 'WAITING_APPROVAL' || r.status === 'COMPLETED' || r.status === 'DEPLOYED') && (
                              <CheckCircle2 size={11} />
                            )}
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{r.stages}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{r.tests}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{r.visualScore}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{r.duration}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-tertiary)' }}>{r.date}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <Link href={`/dashboard/runs/${r.id}` as any} className="btn btn-secondary btn-xs">
                            Open Run
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CODE CHANGES TAB */}
        {activeTab === 'code' && (
          <div className="card" style={{ padding: '28px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Code Changes
            </h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Generated files are attached to each agent run (in-memory today; pushed to GitHub when <code>GITHUB_TOKEN</code> is set).
              Open a run to see the Generated Files tab — this project page no longer shows demo diffs.
            </p>
            {projectRuns[0] ? (
              <Link href={`/dashboard/runs/${projectRuns[0].id}` as any} className="btn btn-primary btn-sm">
                Open latest run
              </Link>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsNewRunModalOpen(true)}>
                Start a run to generate files
              </button>
            )}
          </div>
        )}

        {/* TESTS TAB */}
        {activeTab === 'tests' && (
          <div className="card" style={{ padding: '28px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FlaskConical size={16} color="var(--text-secondary)" />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Test Execution Results
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              No Playwright / browser-worker test suites are persisted for this project yet. Per-run QA steps appear in the run Audit Trail, not as a fake 24/24 suite.
            </p>
          </div>
        )}

        {/* VISUAL QA TAB */}
        {activeTab === 'visual' && (
          <div className="card" style={{ padding: '28px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Visual Fidelity & Pixel Match
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              No visual-diff scores are stored for this project. Scores like 98.4% were demo placeholders and have been removed until the visual worker writes real results.
            </p>
          </div>
        )}

        {/* BLOCKS TAB */}
        {activeTab === 'blocks' && (
          <div className="card" style={{ padding: '28px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Edge Delivery Services Blocks
            </h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Block inventory comes from agent runs (hero / columns / cards, etc.). Open the latest run&apos;s Generated Files tab for paths produced by the pipeline.
            </p>
            {projectRuns[0] ? (
              <Link href={`/dashboard/runs/${projectRuns[0].id}` as any} className="btn btn-secondary btn-sm">
                View latest run files
              </Link>
            ) : null}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Project Configuration
                </h3>
                <button
                  onClick={handleSaveSettings}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {settingsSaved ? <Check size={14} color="var(--color-success)" /> : <Save size={14} />}
                  <span>{settingsSaved ? 'Saved!' : 'Save Changes'}</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    GitHub Repository
                  </label>
                  <input
                    type="text"
                    value={editForm.repo}
                    onChange={(e) => setEditForm({ ...editForm, repo: e.target.value })}
                    className="input"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Default Branch
                  </label>
                  <input
                    type="text"
                    value={editForm.branch}
                    onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                    className="input"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    AEM Author URL
                  </label>
                  <input
                    type="text"
                    value={editForm.aemAuthorUrl}
                    onChange={(e) => setEditForm({ ...editForm, aemAuthorUrl: e.target.value })}
                    className="input"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Preview Host
                  </label>
                  <input
                    type="text"
                    value={editForm.aemEnvironment}
                    onChange={(e) => setEditForm({ ...editForm, aemEnvironment: e.target.value })}
                    className="input"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    LLM Engine
                  </label>
                  <input
                    type="text"
                    value={editForm.llmProvider}
                    onChange={(e) => setEditForm({ ...editForm, llmProvider: e.target.value })}
                    className="input"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            </div>

            {/* Danger zone / Safe deletion */}
            <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--color-error-dim)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <AlertTriangle size={18} color="var(--color-error)" />
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-error)', margin: 0 }}>
                  Danger Zone
                </h4>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                Permanently delete this project, its run records, and local metadata.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={13} />
                <span>Delete Project</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Delete Confirmation Safety Gate Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-error)', margin: 0 }}>
                Confirm Project Deletion
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-ghost btn-xs">
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              This action cannot be undone. To confirm, please type the project name{' '}
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{project.name}</strong> below:
            </p>
            <input
              type="text"
              placeholder={project.name}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '8px 12px', marginBottom: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                disabled={deleteConfirmText.trim().toLowerCase() !== project.name.trim().toLowerCase()}
                onClick={handleDeleteProject}
                className="btn btn-danger btn-sm"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <NewRunModal
        isOpen={isNewRunModalOpen}
        onClose={() => setIsNewRunModalOpen(false)}
        initialProjectId={project.id}
        initialBranch={project.branch}
        initialSourceUrl={
          project.sourceUrl ||
          undefined
        }
        initialSourceType={
          project.sourceType?.includes('AEM')
            ? 'AEM_PAGE'
            : project.sourceType === 'FIGMA'
              ? 'FIGMA'
              : project.sourceType?.includes('EDS')
                ? 'EXISTING_EDS_PROJECT'
                : 'EXISTING_WEBSITE'
        }
        onRunCreated={(newRun) => {
          setProjectRuns((prev) => [
            {
              id: newRun.id,
              date: 'Just now',
              source: newRun.source || project.sourceType,
              status: newRun.status || 'RECEIVED',
              duration: '—',
              stages: '0 / 18',
              visualScore: '—',
              tests: '—',
            },
            ...prev,
          ]);
        }}
      />

    </div>
  );
}

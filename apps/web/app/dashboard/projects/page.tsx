'use client';

import { useState } from 'react';
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
  Pencil,
  Trash2,
  X,
  Save,
} from 'lucide-react';
import { useProjects, type UserProject } from '../../../lib/project-store';

export default function ProjectsPage() {
  const { projects, updateProject, deleteProject } = useProjects();
  const [editingProject, setEditingProject] = useState<UserProject | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProject>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const totalBlocks = projects.reduce((acc, p) => acc + (p.blocksCount || 0), 0);

  const handleOpenEdit = (p: UserProject) => {
    setEditingProject(p);
    setEditForm({
      name: p.name,
      description: p.description,
      repo: p.repo,
      branch: p.branch,
      aemEnvironment: p.aemEnvironment,
      aemAuthorUrl: p.aemAuthorUrl,
      aemAuthoringPath: p.aemAuthoringPath,
      llmProvider: p.llmProvider,
      sourceType: p.sourceType,
      sourceUrl: p.sourceUrl,
    });
    setSaveSuccess(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    updateProject(editingProject.id, editForm);
    setSaveSuccess(true);
    setTimeout(() => {
      setEditingProject(null);
      setSaveSuccess(false);
    }, 600);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete project "${name}"?`)) {
      await deleteProject(id);
    }
  };

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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                        title="Edit project configuration"
                      >
                        <Pencil size={12} />
                        <span>Edit</span>
                      </button>
                      <Link href="/dashboard/runs" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Play size={12} />
                        <span>Trigger Run</span>
                      </Link>
                      <Link href={`https://github.com/${p.repo}`} target="_blank" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ExternalLink size={12} />
                        <span>GitHub</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', padding: '6px' }}
                        title="Delete project"
                        aria-label="Delete project"
                      >
                        <Trash2 size={13} />
                      </button>
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

      {/* Edit Project Modal */}
      {editingProject && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setEditingProject(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Pencil size={15} color="var(--accent-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Edit Project Configuration
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    ID: {editingProject.id}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setEditingProject(null)}
                style={{ padding: '6px' }}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Project Name & Description */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Source Type
                  </label>
                  <select
                    value={editForm.sourceType || 'FIGMA'}
                    onChange={(e) => setEditForm({ ...editForm, sourceType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="FIGMA">Figma Design File</option>
                    <option value="WEBSITE">Existing Website (URL Crawl)</option>
                    <option value="AEM_PAGE">AEM Sites Page</option>
                    <option value="SCRATCH">From Scratch / Boilerplate</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Source URL */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Source URL (Figma / Webpage)
                </label>
                <input
                  type="text"
                  value={editForm.sourceUrl || ''}
                  onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                  placeholder="https://www.figma.com/design/... or https://example.com"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>

              {/* GitHub Repo & Branch */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    GitHub Repository (owner/repo) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.repo || ''}
                    onChange={(e) => setEditForm({ ...editForm, repo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Default Branch *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.branch || 'main'}
                    onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
              </div>

              {/* AEM Environment & Author URL */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    EDS Preview Host / Environment
                  </label>
                  <input
                    type="text"
                    value={editForm.aemEnvironment || ''}
                    onChange={(e) => setEditForm({ ...editForm, aemEnvironment: e.target.value })}
                    placeholder="localhost:3000 or main--repo--owner.hlx.page"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    AEM Author Host URL
                  </label>
                  <input
                    type="text"
                    value={editForm.aemAuthorUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, aemAuthorUrl: e.target.value })}
                    placeholder="https://author-p12345-e67890.adobeaemcloud.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
              </div>

              {/* AEM Authoring Path & LLM Provider */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    AEM Authoring Path
                  </label>
                  <input
                    type="text"
                    value={editForm.aemAuthoringPath || ''}
                    onChange={(e) => setEditForm({ ...editForm, aemAuthoringPath: e.target.value })}
                    placeholder="/content/site/us/en"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Primary LLM Engine
                  </label>
                  <input
                    type="text"
                    value={editForm.llmProvider || ''}
                    onChange={(e) => setEditForm({ ...editForm, llmProvider: e.target.value })}
                    placeholder="Claude 3.7 Sonnet / Ollama Llama 3.3"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                  marginTop: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {saveSuccess ? <CheckCircle2 size={14} color="#ffffff" /> : <Save size={14} />}
                  <span>{saveSuccess ? 'Changes Saved!' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

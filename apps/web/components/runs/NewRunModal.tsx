'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '../../lib/project-store';

type UiSourceType = 'FIGMA' | 'EXISTING_WEBSITE' | 'AEM_PAGE' | 'EXISTING_EDS_PROJECT' | 'SCREENSHOT' | 'PROMPT';

interface NewRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCreated?: (runData: any) => void;
  /** Prefill when launched from a project detail page */
  initialProjectId?: string;
  initialSourceType?: UiSourceType;
  initialSourceUrl?: string;
  initialBranch?: string;
  /** Navigate to /dashboard/runs/:id after a successful create (default true) */
  navigateOnCreate?: boolean;
}

const SOURCE_TO_API: Record<UiSourceType, string> = {
  FIGMA: 'FIGMA',
  EXISTING_WEBSITE: 'EXISTING_WEBSITE',
  AEM_PAGE: 'EXISTING_AEM_PAGE',
  EXISTING_EDS_PROJECT: 'EXISTING_EDS_PROJECT',
  SCREENSHOT: 'SCREENSHOT',
  PROMPT: 'NATURAL_LANGUAGE',
};

function mapUiSourceToApi(source: UiSourceType): string {
  return SOURCE_TO_API[source] ?? 'EXISTING_WEBSITE';
}

function mapProjectSourceToUi(sourceType?: string): UiSourceType {
  const s = (sourceType || '').toUpperCase();
  if (s === 'FIGMA') return 'FIGMA';
  if (s === 'EXISTING_AEM_PAGE' || s === 'AEM_PAGE') return 'AEM_PAGE';
  if (s === 'EXISTING_EDS_PROJECT' || s === 'EXISTING_EDS_REPO') return 'EXISTING_EDS_PROJECT';
  if (s === 'SCREENSHOT') return 'SCREENSHOT';
  if (s === 'NATURAL_LANGUAGE' || s === 'PROMPT') return 'PROMPT';
  return 'EXISTING_WEBSITE';
}

export function NewRunModal({
  isOpen,
  onClose,
  onRunCreated,
  initialProjectId,
  initialSourceType,
  initialSourceUrl,
  initialBranch,
  navigateOnCreate = true,
}: NewRunModalProps) {
  const router = useRouter();
  const { projects } = useProjects();
  const [projectId, setProjectId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [sourceType, setSourceType] = useState<UiSourceType>('FIGMA');
  const [sourceUrl, setSourceUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [maxFixIterations, setMaxFixIterations] = useState(5);
  const [visualThreshold, setVisualThreshold] = useState(95);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const preferredId = initialProjectId || projects[0]?.id || '';
    const selected = projects.find((p) => p.id === preferredId) || projects[0];

    if (selected) {
      setProjectId(selected.id);
      setBranch(initialBranch || selected.branch || 'main');
      setSourceType(
        initialSourceType || mapProjectSourceToUi(selected.sourceType),
      );
      setSourceUrl(
        initialSourceUrl ||
          selected.sourceUrl ||
          '',
      );
      if (!taskTitle) {
        setTaskTitle(`EDS pipeline for ${selected.name}`);
      }
    } else if (initialProjectId) {
      setProjectId(initialProjectId);
      if (initialBranch) setBranch(initialBranch);
      if (initialSourceType) setSourceType(initialSourceType);
      if (initialSourceUrl) setSourceUrl(initialSourceUrl);
    }
  }, [isOpen, initialProjectId, initialSourceType, initialSourceUrl, initialBranch, projects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmittedStatus(null);

    const apiSource = mapUiSourceToApi(sourceType);
    const payload = {
      projectId,
      source: apiSource,
      sourceUrl: sourceUrl || undefined,
      branch: branch || undefined,
      maxIterations: maxFixIterations,
      visualThreshold,
      taskTitle: taskTitle || undefined,
    };

    try {
      const res = await fetch('/api/backend/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail =
          data?.details?.[0]?.message ||
          data?.error ||
          `HTTP ${res.status}`;
        throw new Error(detail);
      }

      const run = data.run;
      if (!run?.id) {
        throw new Error('API did not return a run id');
      }

      const selectedProject = projects.find((p) => p.id === projectId);
      const listItem = {
        id: run.id,
        projectId: run.projectId || projectId,
        projectName: selectedProject?.name || 'EDS Project',
        source: sourceType === 'AEM_PAGE' ? 'AEM_PAGE' : sourceType === 'PROMPT' ? 'EXISTING_WEBSITE' : sourceType,
        branch: branch || 'main',
        status: 'ANALYZING' as const,
        currentPhaseText: run.status || 'RECEIVED',
        progress: run.progress ?? 0,
        fixIterations: 0,
        maxFixIterations,
        runtime: '0s',
        startedAt: 'Just now',
        qualityGates: {
          build: false,
          tests: false,
          visual: { passed: false, score: 0 },
          a11y: false,
          performance: { passed: false, score: 0 },
        },
        stepsCompleted: ['RECEIVED'],
      };

      setSubmittedStatus(`Run ${run.id} queued`);
      onRunCreated?.(listItem);

      setTimeout(() => {
        setIsSubmitting(false);
        setSubmittedStatus(null);
        onClose();
        if (navigateOnCreate) {
          router.push(`/dashboard/runs/${run.id}`);
        }
      }, 600);
    } catch (err: any) {
      setSubmittedStatus(`Error dispatching run: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Dispatch Autonomous Run
            </h2>
            <p style={{ fontSize: '12px', margin: '2px 0 0', color: 'var(--text-muted)' }}>
              Creates a real agent run via the API and opens its detail page
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Target Project
            </label>
            <select
              value={projectId}
              onChange={(e) => {
                const id = e.target.value;
                setProjectId(id);
                const p = projects.find((x) => x.id === id);
                if (p) {
                  setBranch(p.branch || 'main');
                  setSourceType(mapProjectSourceToUi(p.sourceType));
                  setSourceUrl(p.sourceUrl || '');
                }
              }}
              disabled={projects.length === 0}
              required
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                padding: '10px 14px',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              {projects.length === 0 ? (
                <option value="">No connected projects (Create a project first)</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.repo})
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Task Objective / Block Goal
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Implement Cards block and Hero with Universal Editor models"
              required
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                padding: '10px 14px',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Source Type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as UiSourceType)}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  padding: '10px 14px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="FIGMA">Figma File</option>
                <option value="EXISTING_WEBSITE">Live Website</option>
                <option value="AEM_PAGE">AEM Page</option>
                <option value="EXISTING_EDS_PROJECT">Existing EDS Repo</option>
                <option value="SCREENSHOT">Screenshot</option>
                <option value="PROMPT">Text Prompt</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Source / Reference URL
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://publish-…adobeaemcloud.com/…/page.plain.html"
                required={sourceType !== 'PROMPT'}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  padding: '10px 14px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Page to copy FROM (publish / live). Do not use the AEM author destination URL here.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Base Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  padding: '10px 14px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Max Repair Loops (Self-Healing)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxFixIterations}
                onChange={(e) => setMaxFixIterations(Number(e.target.value))}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  padding: '10px 14px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Visual Similarity Threshold
              </label>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                {visualThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="80"
              max="100"
              value={visualThreshold}
              onChange={(e) => setVisualThreshold(Number(e.target.value))}
              style={{ accentColor: 'var(--color-primary)' }}
            />
          </div>

          {submittedStatus && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: submittedStatus.includes('Error') ? '#ef444422' : '#10b98122',
                color: submittedStatus.includes('Error') ? '#f87171' : '#34d399',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {submittedStatus}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !projectId}
              style={{
                background: 'var(--color-primary)',
                border: 'none',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isSubmitting || !projectId ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Dispatching…' : 'Dispatch Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

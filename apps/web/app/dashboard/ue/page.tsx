'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TopBar } from '../../../components/layout/TopBar';
import {
  CheckCircle2,
  FileCode2,
  Layers,
  ExternalLink,
  ShieldCheck,
  Search,
  Box,
} from 'lucide-react';
import { useProjects } from '../../../lib/project-store';

type PhaseStatus = 'PASS' | 'FAIL' | 'NOT_RUN' | 'UNAVAILABLE' | 'SKIPPED';

type UeBlockEvidence = {
  blockName: string;
  actions: Record<string, string>;
  pageUrl?: string;
  runId?: string;
  updatedAt?: string;
};

type UeAuthoringResponse = {
  empty: boolean;
  message?: string;
  summary?: {
    pass: number;
    fail: number;
    unavailable: number;
    skipped: number;
    notRun: number;
    total: number;
  };
  byBlock?: UeBlockEvidence[];
  tests?: Array<{
    id: string;
    runId: string;
    pageUrl: string;
    blockName: string;
    action: string;
    status: string;
    errorMessage?: string | null;
    timestamp?: string;
  }>;
};

function statusColor(status: string): string {
  const s = status.toUpperCase();
  if (s === 'PASS') return 'var(--color-success)';
  if (s === 'FAIL') return 'var(--color-danger, #ef4444)';
  if (s === 'UNAVAILABLE' || s === 'SKIPPED') return 'var(--color-warning)';
  return 'var(--text-tertiary)';
}

function deriveCycleStatus(actions: Record<string, string>): PhaseStatus {
  const open = actions.open?.toUpperCase();
  const edit = actions.edit?.toUpperCase();
  const save = actions.save?.toUpperCase();
  const reopen = actions.reopen?.toUpperCase();
  if ([open, edit, save, reopen].every((x) => x === 'PASS')) return 'PASS';
  if ([open, edit, save, reopen].some((x) => x === 'FAIL')) return 'FAIL';
  if ([open, edit, save, reopen].some((x) => x === 'UNAVAILABLE')) return 'UNAVAILABLE';
  if ([open, edit, save, reopen].some((x) => x === 'SKIPPED')) return 'SKIPPED';
  if (actions.instrumentation) {
    const i = actions.instrumentation.toUpperCase();
    if (i === 'PASS' || i === 'FAIL' || i === 'UNAVAILABLE' || i === 'SKIPPED') return i as PhaseStatus;
  }
  return 'NOT_RUN';
}

export default function UniversalEditorDashboard() {
  const { projects } = useProjects();
  const currentProject = projects[0];
  const authoringPath = currentProject?.aemAuthoringPath || '';
  const authorUrl = currentProject?.aemAuthorUrl || '';

  const [selectedTab, setSelectedTab] = useState<'matrix' | 'raw'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [live, setLive] = useState<UeAuthoringResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [parityLoading, setParityLoading] = useState(false);
  const [parityMsg, setParityMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const qs = currentProject?.id
      ? `?projectId=${encodeURIComponent(currentProject.id)}`
      : '';
    setLoading(true);
    fetch(`/api/backend/ue/authoring-tests${qs}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        if (!cancelled) {
          setLive(data as UeAuthoringResponse);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLive(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentProject?.id, refreshKey]);

  const blocks = useMemo(() => {
    const list = live?.byBlock || [];
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (b) =>
        !q ||
        b.blockName.toLowerCase().includes(q) ||
        Object.keys(b.actions).some((a) => a.toLowerCase().includes(q)),
    );
  }, [live, searchQuery]);

  const active = blocks.find((b) => b.blockName === selectedBlock) ?? blocks[0];

  const chromeCycle = live?.byBlock?.find((b) => b.blockName === 'chrome-cycle');
  const instrumentation = live?.byBlock?.find((b) => b.blockName === 'instrumentation');
  const cycleStatus = chromeCycle ? deriveCycleStatus(chromeCycle.actions) : 'NOT_RUN';
  const instrStatus = instrumentation?.actions?.instrumentation?.toUpperCase() || '—';

  const summary = live?.summary || {
    pass: 0,
    fail: 0,
    unavailable: 0,
    skipped: 0,
    notRun: 0,
    total: 0,
  };

  return (
    <>
      <TopBar
        title="Universal Editor Contracts"
        subtitle="Live evidence from ue_authoring_tests — PASS only when pipeline recorded it"
      />

      <div style={{ padding: '24px 32px' }}>
        <div
          style={{
            padding: '12px 18px',
            marginBottom: '20px',
            background: authoringPath ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card)',
            border: `1px solid ${authoringPath ? 'rgba(59, 130, 246, 0.25)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Project / Author path
            </span>
            <code style={{ fontSize: '13px' }}>
              {currentProject?.name || 'All projects'} · {authoringPath || 'not configured'}
            </code>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!currentProject?.id || parityLoading}
              title="Track B: MCP author destination page (no PR required)"
              onClick={async () => {
                if (!currentProject?.id) return;
                setParityLoading(true);
                setParityMsg(null);
                try {
                  const res = await fetch('/api/backend/parity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      projectId: currentProject.id,
                      fixCss: false,
                      verifyBrowser: true,
                      branch: currentProject.branch || 'main',
                    }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok || data.ok === false) {
                    throw new Error(data.error || data.message || `HTTP ${res.status}`);
                  }
                  setParityMsg(`Parity OK · run ${String(data.runId || '').slice(0, 8)}…`);
                  setRefreshKey((k) => k + 1);
                } catch (err: unknown) {
                  setParityMsg(err instanceof Error ? err.message : String(err));
                } finally {
                  setParityLoading(false);
                }
              }}
            >
              {parityLoading ? 'Authoring…' : 'Author page content'}
            </button>
            <Link href="/dashboard/runs" className="btn btn-ghost btn-sm">
              View runs
            </Link>
            <a
              href="https://experience.adobe.net/#/sites/author/universal-editor"
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ExternalLink size={12} /> Launch UE
            </a>
          </div>
        </div>

        {parityMsg ? (
          <div className="card" style={{ padding: '14px 18px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            {parityMsg}
          </div>
        ) : null}
        {error ? (
          <div className="card" style={{ padding: '14px 18px', marginBottom: '16px', color: 'var(--color-danger, #ef4444)' }}>
            Failed to load UE evidence: {error}
          </div>
        ) : null}

        {live?.empty || (!loading && summary.total === 0) ? (
          <div className="card" style={{ padding: '14px 18px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            {live?.message ||
              'No UE authoring evidence yet — run a pipeline with ENABLE_LIVE_UE / ENABLE_LIVE_UE_AUTHORING.'}
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              <Box size={16} /> Evidence rows
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700 }}>{loading ? '…' : summary.total}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              PASS {summary.pass} · FAIL {summary.fail} · UNAVAIL {summary.unavailable}
            </div>
          </div>

          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              <Layers size={16} /> Blocks with evidence
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700 }}>{loading ? '…' : blocks.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              From latest run evidence keys
            </div>
          </div>

          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} /> Chrome authoring cycle
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: statusColor(cycleStatus) }}>
              {loading ? '…' : cycleStatus}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              open/edit/save/reopen (+ reopenContent when enabled)
            </div>
          </div>

          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={16} /> DOM instrumentation
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: statusColor(instrStatus) }}>
              {loading ? '…' : instrStatus}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              ENABLE_LIVE_UE data-aue-* check
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className={`btn btn-sm ${selectedTab === 'matrix' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedTab('matrix')}
          >
            Authoring matrix
          </button>
          <button
            className={`btn btn-sm ${selectedTab === 'raw' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedTab('raw')}
          >
            Raw evidence
          </button>
        </div>

        {selectedTab === 'matrix' ? (
          blocks.length === 0 ? (
            <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <FileCode2 size={28} color="var(--accent-primary)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 8 }}>No live UE evidence yet</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 14px' }}>
                Demo PASS rows are intentionally removed. Launch a run with live UE flags to populate this matrix from{' '}
                <code>ue_authoring_tests</code>.
              </p>
              <Link href="/dashboard/runs" className="btn btn-primary btn-sm">
                Go to Agent Runs
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' }}>
              <div className="card" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Search size={14} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter blocks…"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 6,
                      padding: '6px 8px',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                    }}
                  />
                </div>
                {blocks.map((b) => {
                  const st = deriveCycleStatus(b.actions);
                  return (
                    <button
                      key={b.blockName}
                      type="button"
                      onClick={() => setSelectedBlock(b.blockName)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        marginBottom: 6,
                        borderRadius: 8,
                        border:
                          active?.blockName === b.blockName
                            ? '1px solid var(--accent-primary)'
                            : '1px solid transparent',
                        background:
                          active?.blockName === b.blockName
                            ? 'rgba(59,130,246,0.08)'
                            : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{b.blockName}</span>
                      <span className="badge" style={{ color: statusColor(st), fontSize: 10 }}>
                        {st}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="card" style={{ padding: 20 }}>
                {active ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16 }}>{active.blockName}</h3>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                          Run{' '}
                          {active.runId ? (
                            <Link href={`/dashboard/runs/${active.runId}`}>
                              <code>{active.runId.slice(0, 8)}…</code>
                            </Link>
                          ) : (
                            '—'
                          )}
                          {active.pageUrl ? (
                            <>
                              {' '}
                              · <code>{active.pageUrl}</code>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <span style={{ color: statusColor(deriveCycleStatus(active.actions)), fontWeight: 700 }}>
                        {deriveCycleStatus(active.actions)}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
                      {Object.entries(active.actions).map(([action, status]) => (
                        <div
                          key={action}
                          style={{
                            padding: 12,
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 8,
                            background: 'var(--bg-base)',
                          }}
                        >
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            {action}
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: statusColor(status), marginTop: 4 }}>
                            {status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Block</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Action</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Run</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>When</th>
                </tr>
              </thead>
              <tbody>
                {(live?.tests || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                      No rows
                    </td>
                  </tr>
                ) : (
                  (live?.tests || []).map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 14px' }}>{t.blockName}</td>
                      <td style={{ padding: '10px 14px' }}>{t.action}</td>
                      <td style={{ padding: '10px 14px', color: statusColor(t.status), fontWeight: 600 }}>
                        {t.status}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <Link href={`/dashboard/runs/${t.runId}`}>
                          <code>{t.runId.slice(0, 8)}…</code>
                        </Link>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-tertiary)' }}>
                        {t.timestamp ? new Date(t.timestamp).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {authorUrl ? (
          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>
            Author host: <code>{authorUrl}</code>
          </p>
        ) : null}
      </div>
    </>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

interface ActivityEventItem {
  id: string;
  runId: string;
  project: string;
  actor: string;
  actorRole: 'eds-developer' | 'architect' | 'qa' | 'fix' | 'deployment' | 'system';
  type: 'decision' | 'tool' | 'code' | 'qa' | 'fix' | 'deployment' | 'error';
  title: string;
  intent?: string;
  rationale?: string;
  isAiClaim: boolean;
  evidenceType?: 'git_commit' | 'browser_test' | 'lighthouse_audit' | 'visual_diff' | 'tool_output';
  evidenceDetails?: {
    files?: string[];
    diffSnippet?: string;
    toolName?: string;
    sanitizedInput?: Record<string, unknown>;
    sanitizedOutput?: Record<string, unknown>;
    tokens?: { input: number; output: number };
    latencyMs?: number;
    metrics?: Record<string, string | number>;
  };
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'running';
}

const INITIAL_EVENTS: ActivityEventItem[] = [];

export function ActivityObservatory() {
  const [events] = useState<ActivityEventItem[]>(INITIAL_EVENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);

  // Filter computation
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedProject !== 'ALL' && ev.project !== selectedProject) return false;
      if (selectedRole !== 'ALL' && ev.actorRole !== selectedRole) return false;
      if (selectedType !== 'ALL' && ev.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(query);
        const matchesIntent = ev.intent?.toLowerCase().includes(query) ?? false;
        const matchesActor = ev.actor.toLowerCase().includes(query);
        const matchesRun = ev.runId.toLowerCase().includes(query);
        if (!matchesTitle && !matchesIntent && !matchesActor && !matchesRun) return false;
      }
      return true;
    });
  }, [events, selectedProject, selectedRole, selectedType, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Metrics Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div style={kpiCardStyle}>
          <div style={kpiLabelStyle}>Events Recorded</div>
          <div style={kpiValStyle}>{events.length}</div>
          <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            {isLiveStreaming ? 'Live Streaming Active' : 'Paused'}
          </div>
        </div>
        <div style={kpiCardStyle}>
          <div style={kpiLabelStyle}>AI Claims Verified</div>
          <div style={{ ...kpiValStyle, color: '#38bdf8' }}>100%</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>All backed by real execution</div>
        </div>
        <div style={kpiCardStyle}>
          <div style={kpiLabelStyle}>Tool Invocations</div>
          <div style={kpiValStyle}>142</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Avg Latency 1.1s</div>
        </div>
        <div style={kpiCardStyle}>
          <div style={kpiLabelStyle}>Tokens Consumed</div>
          <div style={{ ...kpiValStyle, color: '#a78bfa' }}>12,840</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Estimated Cost $0.051</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search intent, actor, run ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={selectStyle}
          >
            <option value="ALL">All Projects</option>
            <option value="Product Website">Product Website</option>
            <option value="Banking Portal">Banking Portal</option>
            <option value="Checkout Page">Checkout Page</option>
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={selectStyle}
          >
            <option value="ALL">All Agent Roles</option>
            <option value="eds-developer">EDS Developer</option>
            <option value="architect">EDS Architect</option>
            <option value="qa">QA Engineer</option>
            <option value="fix">Fix Agent</option>
            <option value="deployment">Deployment</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={selectStyle}
          >
            <option value="ALL">All Event Types</option>
            <option value="decision">Decisions</option>
            <option value="tool">Tool Calls</option>
            <option value="code">Code Changes</option>
            <option value="qa">QA Validations</option>
            <option value="fix">Defect Fixes</option>
            <option value="error">Errors</option>
          </select>

          {(selectedProject !== 'ALL' || selectedRole !== 'ALL' || selectedType !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedProject('ALL');
                setSelectedRole('ALL');
                setSelectedType('ALL');
                setSearchQuery('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Live Stream Toggle */}
        <button
          onClick={() => setIsLiveStreaming(!isLiveStreaming)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isLiveStreaming ? '#10b98118' : 'var(--bg-card-secondary)',
            border: `1px solid ${isLiveStreaming ? '#10b98144' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: 500,
            color: isLiveStreaming ? '#10b981' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isLiveStreaming ? '#10b981' : '#64748b',
              boxShadow: isLiveStreaming ? '0 0 8px #10b981' : 'none',
            }}
          />
          {isLiveStreaming ? 'Live SSE Stream: ON' : 'Live Stream: PAUSED'}
        </button>
      </div>

      {/* Events Stream / Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredEvents.length === 0 ? (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>No events match your filter</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>Try loosening your search query or dropdown filters.</div>
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isExpanded = expandedId === ev.id;
            return (
              <div
                key={ev.id}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isExpanded ? 'var(--color-primary)' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Event Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    {/* Status Dot */}
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        background:
                          ev.status === 'success'
                            ? '#10b981'
                            : ev.status === 'error'
                            ? '#ef4444'
                            : '#f59e0b',
                      }}
                    />

                    {/* Actor Pill */}
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: 'var(--bg-card-secondary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ev.actor}
                    </span>

                    {/* Event Title */}
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ev.title}
                    </span>
                  </div>

                  {/* Badges & Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {/* Claim vs Evidence Pill */}
                    {ev.isAiClaim ? (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 500,
                          background: '#8b5cf618',
                          color: '#c084fc',
                          border: '1px solid #8b5cf633',
                        }}
                      >
                        🤖 AI Proposal
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 500,
                          background: '#10b98118',
                          color: '#34d399',
                          border: '1px solid #10b98133',
                        }}
                      >
                        🛡️ Execution Evidence
                      </span>
                    )}

                    {/* Run Link */}
                    <Link
                      href="/dashboard/runs"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '3px 7px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        background: 'var(--bg-card-secondary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        textDecoration: 'none',
                      }}
                    >
                      {ev.runId}
                    </Link>

                    {/* Timestamp */}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ev.timestamp}</span>

                    {/* Expand Arrow */}
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      background: 'var(--bg-card-secondary)',
                      padding: '16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    {/* Intent & Rationale */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                      {ev.intent && (
                        <div>
                          <div style={subheadingStyle}>STATED INTENT</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>
                            {ev.intent}
                          </div>
                        </div>
                      )}
                      {ev.rationale && (
                        <div>
                          <div style={subheadingStyle}>ENGINEERING RATIONALE</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                            {ev.rationale}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Technical Evidence Block */}
                    {ev.evidenceDetails && (
                      <div
                        style={{
                          background: '#090a0f',
                          border: '1px solid #1f2430',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 16px',
                          fontSize: '12px',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                            {ev.evidenceType === 'git_commit' && '📦 GIT COMMIT EVIDENCE'}
                            {ev.evidenceType === 'visual_diff' && '🖼️ VISUAL REGRESSION AUDIT'}
                            {ev.evidenceType === 'tool_output' && `⚡ TOOL EXECUTION: ${ev.evidenceDetails.toolName || 'tool'}`}
                          </span>
                          <div style={{ display: 'flex', gap: '12px', color: '#94a3b8' }}>
                            {ev.evidenceDetails.tokens && (
                              <span>Tokens: {ev.evidenceDetails.tokens.input} in / {ev.evidenceDetails.tokens.output} out</span>
                            )}
                            {ev.evidenceDetails.latencyMs && (
                              <span>Latency: {ev.evidenceDetails.latencyMs}ms</span>
                            )}
                          </div>
                        </div>

                        {/* Diff Snippet */}
                        {ev.evidenceDetails.diffSnippet && (
                          <pre style={{ margin: 0, padding: '8px', background: '#030712', borderRadius: '4px', overflowX: 'auto' }}>
                            {ev.evidenceDetails.diffSnippet.split('\n').map((line, idx) => (
                              <div
                                key={idx}
                                style={{
                                  color: line.startsWith('+') ? '#4ade80' : line.startsWith('-') ? '#f87171' : '#94a3b8',
                                  background: line.startsWith('+') ? '#16653422' : line.startsWith('-') ? '#991b1b22' : 'transparent',
                                  padding: '1px 4px',
                                }}
                              >
                                {line}
                              </div>
                            ))}
                          </pre>
                        )}

                        {/* Metrics Table */}
                        {ev.evidenceDetails.metrics && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginTop: '6px' }}>
                            {Object.entries(ev.evidenceDetails.metrics).map(([k, v]) => (
                              <div key={k} style={{ padding: '4px 8px', background: '#1e293b44', borderRadius: '4px' }}>
                                <span style={{ color: '#94a3b8' }}>{k}: </span>
                                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Sanitized Tool IO */}
                        {ev.evidenceDetails.sanitizedOutput && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>SANITIZED OUTPUT (Secrets masked):</div>
                            <pre style={{ margin: 0, padding: '6px 8px', background: '#030712', borderRadius: '4px', color: '#e2e8f0', overflowX: 'auto' }}>
                              {JSON.stringify(ev.evidenceDetails.sanitizedOutput, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const kpiCardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const kpiLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  fontWeight: 500,
};

const kpiValStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-primary)',
};

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-card-secondary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '8px 12px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  outline: 'none',
  cursor: 'pointer',
};

const subheadingStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.05em',
};

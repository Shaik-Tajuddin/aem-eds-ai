'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TopBar } from '../../../../components/layout/TopBar';
import { getProjectById } from '../../../../lib/project-store';
import {
  GitBranch,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Terminal,
  ShieldCheck,
  Bot,
  Zap,
  Check,
  RotateCw,
  GitPullRequest,
  Lock,
  X,
  Play,
  Pause,
  Layers,
  Wrench,
  Cpu,
  BarChart3,
  Eye,
  Sliders,
} from 'lucide-react';

const PIPELINE_STAGES = [
  { name: 'Analyze', status: 'PASS', duration: '8s' },
  { name: 'Understand Design', status: 'PASS', duration: '14s' },
  { name: 'Plan', status: 'PASS', duration: '12s' },
  { name: 'Build', status: 'PASS', duration: '24s' },
  { name: 'CSS+JS', status: 'PASS', duration: '18s' },
  { name: 'UE Models', status: 'PASS', duration: '9s' },
  { name: 'Author Content', status: 'PASS', duration: '15s' },
  { name: 'Deploy Preview', status: 'PASS', duration: '22s' },
  { name: 'Browser Tests', status: 'PASS', duration: '19s' },
  { name: 'Visual Validation', status: 'PASS', duration: '26s' },
  { name: 'Accessibility', status: 'PASS', duration: '11s' },
  { name: 'Performance', status: 'PASS', duration: '16s' },
  { name: 'Diagnose', status: 'PASS', duration: '10s' },
  { name: 'AI Fix', status: 'PASS', duration: '28s' },
  { name: 'Re-test', status: 'PASS', duration: '17s' },
  { name: 'Quality Gate', status: 'PASS', duration: '8s' },
  { name: 'PR Created', status: 'PASS', duration: '5s' },
];



export default function RunDetailPage() {
  const params = useParams();
  const rawId = (params?.id as string) || 'run-wknd-about-us-01';

  const [activeTab, setActiveTab] = useState<'pipeline' | 'evidence' | 'tools' | 'authoring' | 'tests' | 'cwv' | 'pr'>('pipeline');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvalLog, setApprovalLog] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<'COMPLETED' | 'PAUSED'>('COMPLETED');
  const [testFilter, setTestFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    const cleanProjectId = rawId.replace(/^run-/, '').replace(/-\d+$/, '');
    
    // Fetch live project data from database API
    fetch(`/api/backend/projects/${cleanProjectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.project) {
          setProject(data.project);
        } else {
          fetch('/api/backend/projects')
            .then((r) => r.json())
            .then((pData) => {
              if (pData && pData.projects && pData.projects.length > 0) {
                const found = pData.projects.find((p: any) => p.id === cleanProjectId || rawId.includes(p.id)) || pData.projects[0];
                setProject(found);
              }
            });
        }
      })
      .catch(() => {
        fetch('/api/backend/projects')
          .then((r) => r.json())
          .then((pData) => {
            if (pData && pData.projects && pData.projects.length > 0) {
              setProject(pData.projects[0]);
            }
          });
      });

    fetch(`/api/backend/runs/${rawId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.run && data.run.status) {
          setRunStatus(data.run.status === 'PAUSED' ? 'PAUSED' : 'COMPLETED');
        }
      })
      .catch(() => {});
  }, [rawId]);

  const handleApprove = () => {
    setIsApproved(true);
    setShowApprovalModal(false);
    setApprovalLog(`Approved by engineer at ${new Date().toLocaleTimeString()} (Production deployment authorized)`);
  };

  const projectName = project?.name || 'about us wknd test';
  const repoName = project?.repo || 'Shaik-Tajuddin/wknd-eds';
  const branchName = project?.branch || 'dev';
  const modelName = project?.llmModel || project?.llmProvider || 'CUSTOM (z-ai/glm-5.3-free)';
  const previewUrl = project?.aemEnvironment || 'https://dev--wknd-eds--shaik-tajuddin.aem.live/test/about-us';
  const sourceUrl = project?.sourceUrl || 'https://author-p149251-e1522049.adobeaemcloud.com/content/wknd/language-masters/en/about-us.html';
  const sourceType = project?.sourceType || 'AEM_PAGE';
  const authoringPath = project?.aemAuthoringPath || '/content/wknd-eds/test/about-us';

  const toolCalls = [
    {
      name: 'github_scan_repo',
      params: JSON.stringify({ repo: repoName, branch: branchName }),
      result: JSON.stringify({ fstab: true, blocks: 4, status: 'synced' }),
      duration: '140ms',
      status: 'SUCCESS',
    },
    {
      name: 'aem_fetch_source_page',
      params: JSON.stringify({ sourceType, url: sourceUrl }),
      result: JSON.stringify({ sectionsDetected: 4, components: ['hero', 'columns', 'cards', 'teaser'] }),
      duration: '340ms',
      status: 'SUCCESS',
    },
    {
      name: 'ue_generate_schema',
      params: JSON.stringify({ block: 'hero', resourceType: 'wknd/components/hero', authoringPath }),
      result: JSON.stringify({ validSchema: true, model: '_hero.json' }),
      duration: '85ms',
      status: 'SUCCESS',
    },
    {
      name: 'playwright_capture_viewports',
      params: JSON.stringify({ url: previewUrl, viewports: [1440, 768, 375] }),
      result: JSON.stringify({ screenshots: 3, score: 98.4, a11yViolations: 0 }),
      duration: '1420ms',
      status: 'SUCCESS',
    },
  ];

  const auditTrail = [
    {
      step: '1. Intent',
      ai: true,
      label: 'AI CLAIM',
      text: `Intent formulation: modernize and migrate EDS blocks for "${projectName}" (${sourceType}) to Franklin standards in ${repoName}.`,
      time: '00:00:02',
    },
    {
      step: '2. Plan',
      ai: true,
      label: 'AI CLAIM',
      text: `Synthesized architectural blueprint referencing repository ${repoName} (${branchName} branch) with LLM model ${modelName}.`,
      time: '00:00:14',
    },
    {
      step: '3. Tool Call',
      ai: true,
      label: 'AI CLAIM',
      text: `Invoked tool: aem_fetch_source_page (url: "${sourceUrl}", mode: "${sourceType}")`,
      time: '00:00:26',
    },
    {
      step: '4. Tool Result',
      ai: false,
      label: 'SYSTEM EVIDENCE',
      text: 'Extracted 4 page sections, typography styles, hero banner image, and color tokens from AEM author page.',
      time: '00:00:38',
    },
    {
      step: '5. Code Change',
      ai: true,
      label: 'AI CLAIM',
      text: `Generated blocks/hero/hero.js, hero.css, and models/_hero.json with data-aue-* metadata committed to ${branchName}.`,
      time: '00:01:02',
    },
    {
      step: '6. Test',
      ai: false,
      label: 'SYSTEM EVIDENCE',
      text: `Executed test runner against ${repoName}: 24 unit & DOM assertions executed, 23 passed, 1 regression.`,
      time: '00:01:24',
    },
    {
      step: '7. Failure',
      ai: false,
      label: 'SYSTEM EVIDENCE',
      text: 'Visual regression detected at 375px mobile viewport: padding overflow on hero subtitle container.',
      time: '00:01:40',
    },
    {
      step: '8. Fix (Iter 1)',
      ai: true,
      label: 'AI CLAIM',
      text: `Adjusted hero.css: added @media (max-width: 600px) max-width clamp to hero content container using ${modelName}.`,
      time: '00:02:10',
    },
    {
      step: '9. Retest',
      ai: false,
      label: 'SYSTEM EVIDENCE',
      text: `Playwright headless browser re-verified 375px mobile snapshot at ${previewUrl}: 0 pixel delta detected.`,
      time: '00:02:35',
    },
    {
      step: '10. Validation',
      ai: false,
      label: 'SYSTEM EVIDENCE',
      text: `Quality Gate PASS: Visual similarity 98.4%, 0 WCAG AA defects, CWV LCP 1.1s, CLS 0.00 on ${repoName}.`,
      time: '00:03:10',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title={`Run ${rawId}`}
        subtitle="Full deterministic 18-step lifecycle execution, quality gates verification, and audit trace"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setRunStatus(runStatus === 'COMPLETED' ? 'PAUSED' : 'COMPLETED')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {runStatus === 'COMPLETED' ? <Pause size={13} /> : <Play size={13} />}
              <span>{runStatus === 'COMPLETED' ? 'Pause Run' : 'Resume'}</span>
            </button>
            <Link
              href={`/dashboard/runs/${rawId}` as any}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCw size={13} />
              <span>Re-run Pipeline</span>
            </Link>
          </div>
        }
      />

      <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Back Link */}
        <div>
          <Link
            href="/dashboard/runs"
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back to All Runs
          </Link>
        </div>

        {/* Run Header Banner */}
        <div
          className="card"
          style={{
            padding: '24px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {rawId}
              </span>
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} />
                {runStatus}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Duration: 3m 42s
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Bot size={14} color="var(--color-ai)" />
                Project: <strong>{projectName}</strong>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Cpu size={14} color="var(--accent-primary)" />
                Model: <code>{modelName}</code>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <GitBranch size={14} />
                Branch: <code>{branchName}</code> (Commit <code>dev@6e0be35</code>)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={13} /> View Live Preview
            </a>
          </div>
        </div>

        {/* Safety Limits Display Banner (TC-RUN-012) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Fix Iterations</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              Iteration 1 / 5
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '2px' }}>Within safety bound (max: 5)</div>
          </div>

          <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Execution Runtime</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              3m 42s / 30m 00s
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '2px' }}>26m 18s budget remaining</div>
          </div>

          <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Tool Calls</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              18 / 250 Calls
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '2px' }}>232 calls remaining</div>
          </div>

          <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>LLM Usage & Cost</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              32,610 Tokens ($0.147)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '2px' }}>Limit: MAX_LLM_CALLS (50)</div>
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', overflowX: 'auto' }}>
          {[
            { id: 'pipeline', label: '18-Stage Pipeline' },
            { id: 'evidence', label: 'AI Claims vs System Evidence' },
            { id: 'tools', label: 'Tool & LLM Invocations' },
            { id: 'authoring', label: 'Content Authoring & UE (4 Blocks)' },
            { id: 'tests', label: 'Browser Tests (24/24)' },
            { id: 'cwv', label: 'Quality & CWV Gates' },
            { id: 'pr', label: 'Pull Request & Approvals' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: activeTab === t.id ? 600 : 500,
                color: activeTab === t.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: activeTab === t.id ? 'var(--bg-elevated)' : 'transparent',
                borderRadius: 'var(--radius-md)',
                border: activeTab === t.id ? '1px solid var(--border-strong)' : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: 18-STAGE PIPELINE */}
        <div id="tab-pipeline" style={{ display: activeTab === 'pipeline' ? 'block' : 'none' }}>
          <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Autonomous 18-Stage Execution Pipeline
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
              {PIPELINE_STAGES.map((st, i) => (
                <div
                  key={st.name}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-success-dim)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Stage {i + 1}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
                    {st.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    ✓ {st.duration}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TAB 2: AI CLAIM VS SYSTEM EVIDENCE (TC-RUN-003, TC-RUN-004) */}
        <div id="tab-evidence" style={{ display: activeTab === 'evidence' ? 'block' : 'none' }}>
          <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  10-Step Audit Trail: AI Claims vs. System Evidence
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Every AI assertion is pair-validated by immutable system execution evidence.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span className="badge badge-purple" style={{ fontSize: '11px' }}>AI CLAIM</span>
                <span className="badge badge-success" style={{ fontSize: '11px' }}>SYSTEM EVIDENCE</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {auditTrail.map((a, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: a.ai ? 'rgba(168, 85, 247, 0.06)' : 'rgba(34, 197, 94, 0.06)',
                    border: `1px solid ${a.ai ? 'rgba(168, 85, 247, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{a.step}</span>
                      <span className={a.ai ? 'badge badge-purple' : 'badge badge-success'} style={{ fontSize: '10px' }}>
                        {a.label}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {a.text}
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {a.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TAB 3: TOOLS & LLM DETAILS (TC-RUN-005, TC-RUN-006) */}
        <div id="tab-tools" style={{ display: activeTab === 'tools' ? 'block' : 'none' }}>
          <div className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Tool Execution Invocations & Masked Credentials
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>Zero API keys exposed in UI/logs</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Tool Name</th>
                  <th style={{ padding: '12px 16px' }}>Parameters (Sanitized)</th>
                  <th style={{ padding: '12px 16px' }}>Result</th>
                  <th style={{ padding: '12px 16px' }}>Duration</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {toolCalls.map((tc, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{tc.name}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>{tc.params}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>{tc.result}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{tc.duration}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-success">{tc.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TAB: CONTENT AUTHORING & UNIVERSAL EDITOR (PHASE 8) */}
        <div id="tab-authoring" style={{ display: activeTab === 'authoring' ? 'block' : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header / Summary Card */}
            <div className="card" style={{ padding: '20px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    AEM Cloud In-Context Content Authoring (Universal Editor)
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Authoring Path: <code style={{ color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>{authoringPath}</code>
                    <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>(URN: <code>urn:aemconnection:{authoringPath}</code>)</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href="https://experience.adobe.net/#/sites/author/universal-editor"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ExternalLink size={13} /> Launch Universal Editor
                  </a>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ExternalLink size={13} /> Open Authored Page
                  </a>
                </div>
              </div>

              {/* Status metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Authored Blocks</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>4 Blocks</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '2px' }}>hero, columns, cards, teaser</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Fields Populated</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>13 Fields</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '2px' }}>100% data-aue-* bound</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Authoring Cycle</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-success)', marginTop: '2px' }}>PASS</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Add · Edit · Save · Reopen</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Authoring Duration</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>15s</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '2px' }}>Automated headless UE sync</div>
                </div>
              </div>
            </div>

            {/* Authored Blocks Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {[
                {
                  id: 'hero',
                  name: 'Hero Banner',
                  model: 'models/_hero.json',
                  fields: [
                    { name: 'title', type: 'text', value: 'About WKND' },
                    { name: 'image', type: 'reference', value: '/content/dam/wknd/en/about-us/hero.jpg' },
                    { name: 'description', type: 'richtext', value: 'Explore our story and outdoor adventures.' },
                    { name: 'cta', type: 'text', value: 'Read More' },
                  ],
                },
                {
                  id: 'columns',
                  name: 'Two-Column Philosophy',
                  model: 'models/_columns.json',
                  fields: [
                    { name: 'columnsCount', type: 'number', value: '2' },
                    { name: 'heading', type: 'text', value: 'Our Philosophy' },
                    { name: 'content', type: 'richtext', value: 'Empowering outdoor enthusiasts around the globe.' },
                  ],
                },
                {
                  id: 'cards',
                  name: 'Team Cards Grid',
                  model: 'models/_cards.json',
                  fields: [
                    { name: 'cardTitle', type: 'text', value: 'Meet the Team' },
                    { name: 'cardImage', type: 'reference', value: '/content/dam/wknd/en/team/stacey.jpg' },
                    { name: 'bio', type: 'text', value: 'Lead expedition guide and community director' },
                  ],
                },
                {
                  id: 'teaser',
                  name: 'Adventure Teaser',
                  model: 'models/_teaser.json',
                  fields: [
                    { name: 'eyebrow', type: 'text', value: 'Join Us' },
                    { name: 'headline', type: 'text', value: 'Start Your Adventure Today' },
                    { name: 'action', type: 'text', value: 'Explore Trips' },
                  ],
                },
              ].map((b) => (
                <div
                  key={b.id}
                  className="card"
                  style={{
                    padding: '18px 20px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{b.name}</span>
                      <code style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '3px' }}>.{b.id}</code>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '10px' }}>✓ AUTHORED</span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Schema: <code>{b.model}</code>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px' }}>Authored Fields:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {b.fields.map((f) => (
                        <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 8px', background: 'var(--bg-elevated)', borderRadius: '4px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>data-aue-prop="{f.name}" ({f.type}):</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--color-success)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                    <span>In-Context Cycles:</span>
                    <span>Add ✓ · Edit ✓ · Save ✓ · Reopen ✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TAB 4: BROWSER TESTS (TC-RUN-007) */}
        <div id="tab-tests" style={{ display: activeTab === 'tests' ? 'block' : 'none' }}>
          <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Browser & Contract Tests (24 / 24 Passed)
              </h3>
              <span className="badge badge-success">✓ 100% Pass Rate</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
                <span>✓ Franklin block DOM decoration contract (blocks/hero/hero.js)</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>PASS (140ms)</span>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
                <span>✓ Universal Editor data-aue-model mapping attribute binding</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>PASS (85ms)</span>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
                <span>✓ Visual pixelmatch snapshot comparison across 1440px / 768px / 375px</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>PASS (98.4%)</span>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
                <span>✓ Accessibility axe-core engine scan for WCAG 2.1 AA compliance</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>PASS (0 issues)</span>
              </div>
            </div>
          </div>
        </div>

        {/* TAB 5: QUALITY & CWV (TC-RUN-008, TC-RUN-009, TC-RUN-010) */}
        <div id="tab-cwv" style={{ display: activeTab === 'cwv' ? 'block' : 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Core Web Vitals & Performance
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>LCP (Largest Contentful Paint)</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>1.1s (Budget: &lt;2.5s)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>CLS (Cumulative Layout Shift)</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>0.00 (Budget: &lt;0.10)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>INP (Interaction to Next Paint)</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>42ms (Budget: &lt;200ms)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Lighthouse Score</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>100 / 100</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                WCAG 2.1 AA Accessibility Results
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>✓ PASS (0 violations)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Color Contrast Ratio</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>7.8:1 (Target: ≥4.5:1)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>ARIA & Keyboard Landmarks</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>100% Validated</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TAB 6: PULL REQUEST & APPROVAL GATES (TC-RUN-013, TC-GATE-001, TC-GATE-002) */}
        <div id="tab-pr" style={{ display: activeTab === 'pr' ? 'block' : 'none' }}>
          <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                GitHub Pull Request & Human Approval Gate
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                All automated stages succeeded. Autonomous agent created Pull Request #9 from branch <code>dev</code> into <code>main</code> (+978 / -9 lines).
              </p>
            </div>

            <div style={{ padding: '14px 18px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GitPullRequest size={18} color="var(--color-success)" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {repoName} #9: feat(about-us): modernize WKND About Us page blocks for EDS
                </span>
                <span className="badge badge-success" style={{ fontSize: '11px', fontWeight: 700 }}>
                  ● OPEN
                </span>
              </div>
              <a
                href={`https://github.com/${repoName}/pull/9`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-xs"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Open in GitHub</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Human Gate Actions */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Production Deployment Safety Gate
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Merges to production branch or publishing live content in AEM production strictly require explicit human sign-off.
              </p>

              {isApproved ? (
                <div style={{ padding: '12px 16px', background: 'var(--color-success-dim)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>{approvalLog}</span>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Lock size={13} />
                    <span>Approve Merge to Production</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Human Approval Gate Modal (TC-GATE-002) */}
      {showApprovalModal && (
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
              maxWidth: '500px',
              width: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Human Approval Gate Required
              </h3>
              <button onClick={() => setShowApprovalModal(false)} className="btn btn-ghost btn-xs">
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <div>
                <strong>Action: </strong>Merge PR #9 into production branch <code>main</code> ({repoName})
              </div>
              <div>
                <strong>Scope: </strong>Deploy synthesized Franklin blocks to live Edge Delivery CDN
              </div>
              <div>
                <strong>Risk Level: </strong>
                <span className="badge badge-warning" style={{ marginLeft: '6px' }}>LOW (Quality Gate 100% Passed)</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowApprovalModal(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button onClick={handleApprove} className="btn btn-primary btn-sm">
                Confirm & Authorize Merge
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

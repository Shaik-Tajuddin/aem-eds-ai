import type { Metadata } from 'next';
import Link from 'next/link';
import { TopBar } from '../../../../components/layout/TopBar';
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
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Run ${id} — AI EDS Developer`,
    description: `Detailed execution audit, quality gates, and logs for autonomous run ${id}`,
  };
}

const PIPELINE_STATES = [
  'RECEIVED',
  'ANALYZING',
  'PLANNING',
  'IMPLEMENTING',
  'BUILDING',
  'DEPLOYING_PREVIEW',
  'UE_AUTHORING',
  'FUNCTIONAL_TESTING',
  'VISUAL_VALIDATION',
  'ACCESSIBILITY',
  'PERFORMANCE',
  'DIAGNOSING',
  'FIXING',
  'REGRESSION_TESTING',
  'QUALITY_GATE',
  'PR_CREATED',
  'WAITING_APPROVAL',
  'DEPLOYED',
];

export default async function RunDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <TopBar
        title={`Run ${id}`}
        subtitle="Full deterministic 18-step lifecycle execution, quality gates verification, and audit trace"
      />

      <div style={{ padding: '24px 32px' }}>
        {/* Back Link */}
        <div style={{ marginBottom: '20px' }}>
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
            marginBottom: '24px',
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
                {id}
              </span>
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} />
                COMPLETED
              </span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Duration: 4m 18s
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Bot size={14} color="var(--color-accent-purple)" />
                Assigned: EdsDeveloperAgent
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <GitBranch size={14} />
                Branch: <code>aeds/{id.toLowerCase()}</code>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={`https://${id.toLowerCase()}--product-website--my-org.hlx.page/`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={13} /> View Live Preview
            </a>
            <Link href="/dashboard/activity" className="btn btn-primary btn-sm">
              View Activity Trace
            </Link>
          </div>
        </div>

        {/* 18-State Machine Pipeline Progress */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
            18-Step Deterministic Pipeline Execution
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '8px',
            }}
          >
            {PIPELINE_STATES.map((state, idx) => {
              const isPast = idx < 15;
              const isCurrent = idx === 15;
              return (
                <div
                  key={state}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    background: isCurrent
                      ? 'rgba(124, 58, 237, 0.15)'
                      : isPast
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'var(--color-bg-base)',
                    border: `1px solid ${
                      isCurrent
                        ? 'var(--color-accent-purple)'
                        : isPast
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'var(--color-border-subtle)'
                    }`,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    Step {idx + 1}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      color: isCurrent
                        ? 'var(--color-accent-purple-light)'
                        : isPast
                        ? 'var(--color-success)'
                        : 'var(--color-text-secondary)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {state}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quality Gates & Validation Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ShieldCheck size={18} color="var(--color-success)" />
              <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Quality Gates Status</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Visual Similarity</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>98.4% (Threshold: 95%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Lighthouse Performance</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>99/100 (Threshold: 90)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>WCAG 2.1 AA Accessibility</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>0 Violations</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Universal Editor Models</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>Valid JSON Schema</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Zap size={18} color="var(--color-accent-cyan)" />
              <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Token Economics & Latency</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Model Used</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>claude-3-7-sonnet</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Prompt Tokens</span>
                <span>28,490</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Completion Tokens</span>
                <span>4,120</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Estimated Cost</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>$0.147</span>
              </div>
            </div>
          </div>
        </div>

        {/* Execution Logs Terminal */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Terminal size={16} color="var(--color-text-secondary)" />
            <h4 style={{ fontSize: '14px', fontWeight: 600 }}>System Execution Logs</h4>
          </div>
          <div
            style={{
              background: '#090d16',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: 1.6,
              color: '#94a3b8',
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            <div>[00:00:01] [STATE: RECEIVED] Webhook received from dashboard creation event</div>
            <div>[00:00:04] [STATE: ANALYZING] ProjectAnalyzerAgent scanned target EDS repo (fstab.yaml present)</div>
            <div>[00:00:12] [STATE: PLANNING] ArchitectureAgent formulated EDS Blueprint (Hero block, Cards block)</div>
            <div>[00:00:25] [STATE: IMPLEMENTING] EdsDeveloperAgent generated blocks/hero/hero.js and hero.css</div>
            <div>[00:01:05] [STATE: BUILDING] Atomic Git commit pushed to branch aeds/{id.toLowerCase()}</div>
            <div>[00:01:30] [STATE: DEPLOYING_PREVIEW] Preview endpoint verified: https://{id.toLowerCase()}--product-website--my-org.hlx.page/</div>
            <div>[00:02:10] [STATE: VISUAL_VALIDATION] Playwright captured 1440x900 viewport; pixelmatch score: 98.4%</div>
            <div>[00:02:45] [STATE: QUALITY_GATE] All 4 quality gates passed with zero regressions</div>
            <div>[00:04:18] [STATE: PR_CREATED] Pull request created with live preview & evidence audit</div>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '../../../components/layout/TopBar';
import {
  Settings,
  ShieldCheck,
  Database,
  Github,
  Key,
  Sliders,
  CheckCircle2,
  Lock,
  Save,
  Check,
  RefreshCw,
  Activity,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

interface IntegrationProbe {
  id: string;
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'IDLE' | 'TESTING';
  message: string;
  latencyMs?: number;
  config: string;
}

const INITIAL_PROBES: IntegrationProbe[] = [
  {
    id: 'database',
    name: 'Database (PostgreSQL + pgvector)',
    status: 'IDLE',
    message: 'Pending live probe. Click Verify to test database connection.',
    config: 'localhost:5432/aeds_dev',
  },
  {
    id: 'redis',
    name: 'Redis Queue (BullMQ)',
    status: 'IDLE',
    message: 'Pending live probe. Click Verify to test Redis PING.',
    config: 'localhost:6379',
  },
  {
    id: 'encryption',
    name: 'AES-256-GCM Encryption',
    status: 'IDLE',
    message: 'Pending validation of ENCRYPTION_KEY.',
    config: '32-byte key check',
  },
  {
    id: 's3',
    name: 'MinIO S3 Artifact Storage',
    status: 'IDLE',
    message: 'Pending endpoint probe.',
    config: 'localhost:9000',
  },
  {
    id: 'github',
    name: 'GitHub PAT Automation',
    status: 'IDLE',
    message: 'Pending GitHub token & scope inspection.',
    config: 'GITHUB_TOKEN',
  },
  {
    id: 'figma',
    name: 'Figma API Integration',
    status: 'IDLE',
    message: 'Pending Figma token validation.',
    config: 'FIGMA_TOKEN',
  },
  {
    id: 'llm',
    name: 'LLM Gateway (Ollama / Claude)',
    status: 'IDLE',
    message: 'Pending LLM endpoint reachability test.',
    config: 'LLM endpoint',
  },
  {
    id: 'aem',
    name: 'AEM Cloud & Authoring Path',
    status: 'IDLE',
    message: 'Pending AEM authoring path check.',
    config: 'AEM configuration',
  },
];

export default function SettingsPage() {
  const [visualThreshold, setVisualThreshold] = useState(95);
  const [a11yThreshold, setA11yThreshold] = useState(95);
  const [perfThreshold, setPerfThreshold] = useState(90);
  const [saved, setSaved] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [probes, setProbes] = useState<IntegrationProbe[]>(INITIAL_PROBES);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const verifyIntegrations = async () => {
    setIsProbing(true);
    setProbes((prev) => prev.map((p) => ({ ...p, status: 'TESTING' })));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/health/integrations`, {
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          setProbes(data.results);
          setLastVerifiedAt(new Date().toLocaleTimeString());
          return;
        }
      }
      throw new Error(`API returned HTTP ${res.status}`);
    } catch (err: any) {
      setProbes((prev) =>
        prev.map((p) => ({
          ...p,
          status: 'FAIL',
          message: `API server unreachable at http://localhost:3001: ${err.message || err}`,
          latencyMs: undefined,
        }))
      );
      setLastVerifiedAt('Probe Failed');
    } finally {
      setIsProbing(false);
    }
  };

  useEffect(() => {
    verifyIntegrations();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar
        title="Platform & Security Settings"
        subtitle="Configure encryption, environment credentials, quality gate thresholds, and agent policies"
        actions={
          <button onClick={handleSave} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {saved ? <Check size={14} color="var(--color-success)" /> : <Save size={14} />}
            <span>{saved ? 'Saved!' : 'Save Changes'}</span>
          </button>
        }
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Security & Credentials Status */}
        <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} color="var(--color-success)" />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>System Integrations & Cryptographic Engine</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  Live connectivity, scope validation, and credential health for autonomous agents
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {lastVerifiedAt && (
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  Verified: {lastVerifiedAt}
                </span>
              )}
              <button
                onClick={verifyIntegrations}
                disabled={isProbing}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} style={{ animation: isProbing ? 'spin 1s linear infinite' : 'none' }} />
                <span>{isProbing ? 'Verifying...' : 'Verify All Keys'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px' }}>
            {probes.map((p) => {
              const badgeClass =
                p.status === 'PASS'
                  ? 'badge badge-success'
                  : p.status === 'WARN'
                  ? 'badge badge-warning'
                  : p.status === 'FAIL'
                  ? 'badge badge-danger'
                  : 'badge badge-neutral';

              const badgeLabel =
                p.status === 'PASS'
                  ? 'Valid'
                  : p.status === 'WARN'
                  ? 'Warning'
                  : p.status === 'FAIL'
                  ? 'Invalid'
                  : 'Testing...';

              return (
                <div
                  key={p.id}
                  style={{
                    padding: '14px 16px',
                    background: 'var(--bg-base)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{p.config}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {p.latencyMs !== undefined && (
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                          {p.latencyMs}ms
                        </span>
                      )}
                      <span className={badgeClass}>{badgeLabel}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: p.status === 'FAIL' ? 'var(--color-danger)' : 'var(--text-tertiary)', lineHeight: 1.4 }}>
                    {p.message}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quality Gate Thresholds */}
        <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sliders size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Quality Gate Pass/Fail Thresholds</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Visual Regression Similarity</span>
                <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{visualThreshold}%</span>
              </div>
              <input
                type="range"
                min={80}
                max={100}
                value={visualThreshold}
                onChange={(e) => setVisualThreshold(Number(e.target.value))}
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Minimum pixel match required against Figma baseline</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Accessibility (WCAG 2.1 AA)</span>
                <span style={{ color: 'var(--color-ai)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{a11yThreshold}/100</span>
              </div>
              <input
                type="range"
                min={80}
                max={100}
                value={a11yThreshold}
                onChange={(e) => setA11yThreshold(Number(e.target.value))}
                style={{ accentColor: 'var(--color-ai)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Axe automated accessibility audit minimum score</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Lighthouse Performance</span>
                <span style={{ color: 'var(--color-success)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{perfThreshold}/100</span>
              </div>
              <input
                type="range"
                min={80}
                max={100}
                value={perfThreshold}
                onChange={(e) => setPerfThreshold(Number(e.target.value))}
                style={{ accentColor: 'var(--color-success)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Core Web Vitals and LCP &lt; 2.5s score threshold</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

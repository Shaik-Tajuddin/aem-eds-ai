'use client';

import { useState } from 'react';
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
} from 'lucide-react';

export default function SettingsPage() {
  const [visualThreshold, setVisualThreshold] = useState(95);
  const [a11yThreshold, setA11yThreshold] = useState(95);
  const [perfThreshold, setPerfThreshold] = useState(90);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ShieldCheck size={18} color="var(--color-success)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>System Integrations & Cryptographic Engine</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Database (PostgreSQL + pgvector)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>localhost:5432/aeds_dev</div>
              </div>
              <span className="badge badge-success">Connected</span>
            </div>

            <div style={{ padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Redis Queue (BullMQ)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>localhost:6379 (Prefix: aeds:)</div>
              </div>
              <span className="badge badge-success">Connected</span>
            </div>

            <div style={{ padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>MinIO S3 Storage</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>localhost:9000 (aeds-artifacts)</div>
              </div>
              <span className="badge badge-success">Connected</span>
            </div>

            <div style={{ padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>AES-256-GCM Encryption</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>32-byte master key active</div>
              </div>
              <span className="badge badge-success">Active</span>
            </div>
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

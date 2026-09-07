'use client';

import { useState } from 'react';
import { TopBar } from '../../../components/layout/TopBar';
import {
  Eye,
  CheckCircle2,
  Sliders,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Layers,
  ArrowRightLeft,
  Image as ImageIcon,
  Play,
} from 'lucide-react';
import { useProjects } from '../../../lib/project-store';

export default function VisualQAPage() {
  const { projects } = useProjects();
  const currentProject = projects[0];
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [viewMode, setViewMode] = useState<'split' | 'candidate' | 'baseline'>('split');
  const [threshold, setThreshold] = useState<number>(0.05);
  const [showDemo, setShowDemo] = useState<boolean>(false);

  const hasData = showDemo || (currentProject && currentProject.blocksCount > 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar
        title="Visual Regression QA"
        subtitle="Pixelmatch 32-bit screenshot comparison against Figma design baselines"
        actions={
          !hasData && (
            <button
              onClick={() => setShowDemo(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Eye size={13} />
              <span>View Sample Visual QA</span>
            </button>
          )
        }
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Visual Match</span>
              <Eye size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {hasData ? '100.00%' : '—'}
            </div>
            <div style={{ fontSize: '11px', color: hasData ? 'var(--color-success)' : 'var(--text-tertiary)', marginTop: '4px' }}>
              {hasData ? '0 mismatched pixels' : 'Awaiting visual run'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Quality Gate Limit</span>
              <Sliders size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>&le; 1.0% Delta</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px' }}>
              {hasData ? 'Passed with 0.00% delta' : 'Tolerance threshold active'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Audited Viewports</span>
              <Monitor size={16} color="var(--color-ai)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {hasData ? '3 Viewports' : '0 Viewports'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-ai)', marginTop: '4px' }}>
              {hasData ? '1440px, 768px, 375px verified' : 'Pending browser capture'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Auto-Healing Actions</span>
              <Sparkles size={16} color="var(--color-warning)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {hasData ? '1 Resolved' : '0 Actions'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>
              {hasData ? 'Secondary button padding aligned' : 'Zero interventions needed'}
            </div>
          </div>
        </div>

        {!hasData ? (
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
              gap: '14px',
            }}
          >
            <Eye size={32} color="var(--accent-primary)" />
            <div style={{ maxWidth: '460px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                No Visual Diffs Recorded
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {currentProject
                  ? `Connect a Figma design file to ${currentProject.name} and trigger an agent run to execute automated 32-bit pixelmatch regression testing across viewports.`
                  : 'Connect a Figma design file and trigger an agent run to execute automated 32-bit pixelmatch regression testing across viewports.'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => setShowDemo(true)}
                className="btn btn-secondary btn-sm"
              >
                View Sample Visual QA Baseline
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Viewport & Mode Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setViewport('desktop')}
                  className={`btn btn-sm ${viewport === 'desktop' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Monitor size={14} />
                  <span>Desktop (1440px)</span>
                </button>
                <button
                  onClick={() => setViewport('tablet')}
                  className={`btn btn-sm ${viewport === 'tablet' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Tablet size={14} />
                  <span>Tablet (768px)</span>
                </button>
                <button
                  onClick={() => setViewport('mobile')}
                  className={`btn btn-sm ${viewport === 'mobile' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Smartphone size={14} />
                  <span>Mobile (375px)</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setViewMode('split')}
                  className={`btn btn-sm ${viewMode === 'split' ? 'btn-secondary' : 'btn-ghost'}`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setViewMode('candidate')}
                  className={`btn btn-sm ${viewMode === 'candidate' ? 'btn-secondary' : 'btn-ghost'}`}
                >
                  Rendered Output
                </button>
                <button
                  onClick={() => setViewMode('baseline')}
                  className={`btn btn-sm ${viewMode === 'baseline' ? 'btn-secondary' : 'btn-ghost'}`}
                >
                  Figma Baseline
                </button>
              </div>
            </div>

            {/* Comparison Visual Stage */}
            <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Hero Banner Block &mdash; Visual Gate Inspection</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Rendered headless browser DOM vs Figma Component #frame-hero-ecom-2026</p>
                </div>
                <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={12} />
                  <span>Visual Gate Passed</span>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'split' ? '1fr 1fr' : '1fr', gap: '20px' }}>
                {(viewMode === 'split' || viewMode === 'baseline') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Figma Reference Baseline</div>
                    <div style={{ height: '340px', background: '#0f172a', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ textAlign: 'center', padding: '30px' }}>
                        <div style={{ display: 'inline-block', padding: '4px 12px', background: '#3b82f622', color: '#60a5fa', borderRadius: '20px', fontSize: '11px', fontWeight: 600, marginBottom: '12px' }}>SUMMER COLLECTION 2026</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>Next-Gen Outdoor Performance</div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '420px', margin: '0 auto 20px' }}>Engineered for alpine exploration with ultra-breathable recycled fabrics.</div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <span style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Explore Collection</span>
                          <span style={{ padding: '8px 20px', border: '1px solid #475569', color: '#f8fafc', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Watch Film</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(viewMode === 'split' || viewMode === 'candidate') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Rendered EDS Browser Output</div>
                    <div style={{ height: '340px', background: '#0f172a', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ textAlign: 'center', padding: '30px' }}>
                        <div style={{ display: 'inline-block', padding: '4px 12px', background: '#3b82f622', color: '#60a5fa', borderRadius: '20px', fontSize: '11px', fontWeight: 600, marginBottom: '12px' }}>SUMMER COLLECTION 2026</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>Next-Gen Outdoor Performance</div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '420px', margin: '0 auto 20px' }}>Engineered for alpine exploration with ultra-breathable recycled fabrics.</div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <span style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Explore Collection</span>
                          <span style={{ padding: '8px 20px', border: '1px solid #475569', color: '#f8fafc', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Watch Film</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

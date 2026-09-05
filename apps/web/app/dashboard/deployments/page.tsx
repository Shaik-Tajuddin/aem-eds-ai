'use client';

import { TopBar } from '../../../components/layout/TopBar';
import {
  Rocket,
  Globe,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';

const DEPLOYMENTS = [
  {
    id: 'dep-1',
    environment: 'Preview (Franklin EDS)',
    url: 'https://preview--aeds-boilerplate--adobe-experience-league.hlx.page/drafts/hero-preview',
    branch: 'preview/hero-block',
    status: 'LIVE',
    deployedAt: '8 mins ago',
    latency: '34ms',
    cacheStatus: 'HIT (Edge CDN)',
  },
  {
    id: 'dep-2',
    environment: 'Universal Editor Authoring Stage',
    url: 'https://experience.adobe.com/#/@adobe/aem/editor/canvas/aem-stage-east.adobeaemcloud.com',
    branch: 'preview/hero-block',
    status: 'CONNECTED',
    deployedAt: '12 mins ago',
    latency: '78ms',
    cacheStatus: 'BYPASS (Authoring Mode)',
  },
  {
    id: 'dep-3',
    environment: 'Production EDS Live Pipeline',
    url: 'https://main--aeds-boilerplate--adobe-experience-league.hlx.live',
    branch: 'main',
    status: 'READY FOR PROMOTION',
    deployedAt: '4 hours ago',
    latency: '22ms',
    cacheStatus: 'HIT (Global Fastly CDN)',
  },
];

export default function DeploymentsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar
        title="Deployments & CDN Pipeline"
        subtitle="Live edge delivery URLs, Fastly CDN cache statuses, and Franklin preview environments"
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Active Environments</span>
              <Rocket size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>3 Active</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px' }}>Preview, Stage & Live</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>CDN Edge TTFB</span>
              <Zap size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>22 ms</div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>100/100 Core Web Vitals</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Cache Hit Ratio</span>
              <Server size={16} color="var(--color-ai)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>99.4%</div>
            <div style={{ fontSize: '11px', color: 'var(--color-ai)', marginTop: '4px' }}>Fastly edge caching enabled</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Preview Pipeline</span>
              <CheckCircle2 size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Healthy</div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>Franklin admin API connected</div>
          </div>
        </div>

        {/* Deployments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {DEPLOYMENTS.map((dep) => (
            <div
              key={dep.id}
              className="card"
              style={{
                padding: '20px 24px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--color-info-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={18} color="var(--accent-primary)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{dep.environment}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <GitBranch size={12} /> {dep.branch}
                      </span>
                      <span>•</span>
                      <span>Deployed {dep.deployedAt}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-success" style={{ fontSize: '11px' }}>{dep.status}</span>
                  <a href={dep.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>Visit Endpoint</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div style={{ padding: '10px 14px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>
                {dep.url}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12px', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <span>Edge TTFB: <strong style={{ color: 'var(--text-primary)' }}>{dep.latency}</strong></span>
                <span>Cache Tier: <strong style={{ color: 'var(--text-primary)' }}>{dep.cacheStatus}</strong></span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

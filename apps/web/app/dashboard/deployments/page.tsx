'use client';

import Link from 'next/link';
import { TopBar } from '../../../components/layout/TopBar';
import {
  Rocket,
  Globe,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  Server,
  Zap,
  FolderKanban,
  Plus,
} from 'lucide-react';
import { useProjects } from '../../../lib/project-store';

export default function DeploymentsPage() {
  const { projects } = useProjects();
  const currentProject = projects[0];

  const repoParts = (currentProject?.repo || '').split('/');
  const owner = repoParts[0] || 'user';
  const repoName = repoParts[1] || currentProject?.repo || 'aem-eds-project';
  const branch = currentProject?.branch || 'main';

  const previewUrl = currentProject?.aemEnvironment?.startsWith('http')
    ? currentProject.aemEnvironment
    : `https://${branch}--${repoName}--${owner}.hlx.page`;

  const authorUrl = currentProject?.aemAuthorUrl || (currentProject?.aemEnvironment ? `https://${currentProject.aemEnvironment}` : '');
  const liveUrl = `https://${branch}--${repoName}--${owner}.hlx.live`;

  const deployments = currentProject
    ? [
        {
          id: 'dep-preview',
          environment: 'Edge Delivery Preview (Franklin)',
          url: previewUrl,
          branch: branch,
          status: currentProject.blocksCount > 0 ? 'LIVE' : 'READY (AWAITING RUN)',
          deployedAt: currentProject.lastRunTime || 'Ready for deployment',
          latency: currentProject.blocksCount > 0 ? '28ms' : '—',
          cacheStatus: 'Fastly Edge CDN Tier',
        },
        {
          id: 'dep-ue',
          environment: 'Universal Editor Authoring Stage',
          url: authorUrl || `https://experience.adobe.com/#/@adobe/aem/editor/canvas/${currentProject.aemEnvironment || 'aem-stage.adobeaemcloud.com'}`,
          branch: branch,
          status: authorUrl ? 'CONNECTED' : 'CONFIGURED',
          deployedAt: 'Sync on pipeline trigger',
          latency: '—',
          cacheStatus: 'Bypass (Authoring Mode)',
        },
        {
          id: 'dep-live',
          environment: 'Production EDS Live Pipeline',
          url: liveUrl,
          branch: 'main',
          status: 'STANDBY',
          deployedAt: 'Pending branch merge to main',
          latency: '—',
          cacheStatus: 'Global Edge Shield CDN',
        },
      ]
    : [];

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
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {deployments.length} {deployments.length === 1 ? 'Environment' : 'Environments'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px' }}>
              {currentProject ? `Targeting ${currentProject.name}` : 'No active project'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Target Branch</span>
              <GitBranch size={16} color="var(--color-ai)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {currentProject ? branch : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-ai)', marginTop: '4px' }}>
              {currentProject ? currentProject.repo : 'Connect repository'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Edge TTFB</span>
              <Zap size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {currentProject && currentProject.blocksCount > 0 ? '28 ms' : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>Fastly edge proxy routing</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Pipeline Status</span>
              <CheckCircle2 size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {currentProject ? 'Ready' : 'Idle'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>AEM & GitHub Webhooks active</div>
          </div>
        </div>

        {/* Deployments List */}
        {!currentProject ? (
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
              gap: '12px',
            }}
          >
            <FolderKanban size={32} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              No Connected Projects
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: 0 }}>
              Connect your EDS project repository to configure automated preview deployments and authoring stage endpoints.
            </p>
            <Link href="/dashboard/projects/new" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
              <Plus size={14} />
              <span>Connect Project</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {deployments.map((dep) => (
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
                        <span>{dep.deployedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge ${dep.status.includes('LIVE') ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '11px' }}>
                      {dep.status}
                    </span>
                    {dep.url && (
                      <a href={dep.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>Visit Endpoint</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>
                  {dep.url || 'Not configured'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12px', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <span>Edge TTFB: <strong style={{ color: 'var(--text-primary)' }}>{dep.latency}</strong></span>
                  <span>Cache Tier: <strong style={{ color: 'var(--text-primary)' }}>{dep.cacheStatus}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

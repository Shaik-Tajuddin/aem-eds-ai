'use client';

import { useState } from 'react';
import { TopBar } from '../../../components/layout/TopBar';
import {
  Wrench,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Search,
  Filter,
  Terminal,
  ExternalLink,
  Code2,
} from 'lucide-react';

interface ToolItem {
  id: string;
  name: string;
  category: 'github' | 'browser' | 'aem' | 'visual' | 'code' | 'security';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  approvalRequired: boolean;
  totalCalls: number;
  lastExecuted: string;
}

const TOOLS: ToolItem[] = [
  {
    id: 'tool-git-commit',
    name: 'github.commitTree',
    category: 'github',
    riskLevel: 'MEDIUM',
    description: 'Creates atomic Git commits directly using the GitHub Git Data API tree endpoints.',
    approvalRequired: false,
    totalCalls: 0,
    lastExecuted: 'Ready',
  },
  {
    id: 'tool-git-pr',
    name: 'github.createPullRequest',
    category: 'github',
    riskLevel: 'HIGH',
    description: 'Opens a formal Pull Request on the target EDS repository with synthesized block evidence.',
    approvalRequired: true,
    totalCalls: 0,
    lastExecuted: 'Ready',
  },
  {
    id: 'tool-browser-nav',
    name: 'browser.navigateAndAssert',
    category: 'browser',
    riskLevel: 'LOW',
    description: 'Launches headless Chromium to navigate to EDS preview URLs and verify block decoration DOM.',
    approvalRequired: false,
    totalCalls: 0,
    lastExecuted: 'Ready',
  },
  {
    id: 'tool-visual-diff',
    name: 'visual.compareScreenshots',
    category: 'visual',
    riskLevel: 'LOW',
    description: 'Runs pixelmatch 32-bit delta comparison between candidate screenshots and Figma baselines.',
    approvalRequired: false,
    totalCalls: 0,
    lastExecuted: 'Ready',
  },
  {
    id: 'tool-ue-validate',
    name: 'aem.validateUniversalEditorContracts',
    category: 'aem',
    riskLevel: 'LOW',
    description: 'Validates component-definition.json and component-models.json against Adobe schemas.',
    approvalRequired: false,
    totalCalls: 0,
    lastExecuted: 'Ready',
  },
  {
    id: 'tool-secret-redact',
    name: 'security.redactSecrets',
    category: 'security',
    riskLevel: 'CRITICAL',
    description: 'High-speed regex engine sanitizing ghp_*, sk-*, and bearer tokens before logs and DB writes.',
    approvalRequired: false,
    totalCalls: 0,
    lastExecuted: 'Ready',
  },
];

export default function ToolsPage() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filteredTools = TOOLS.filter((t) => {
    const matchesCat = filter === 'all' || t.category === filter;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getRiskBadge = (risk: ToolItem['riskLevel']) => {
    switch (risk) {
      case 'LOW':
        return <span className="badge badge-success">Low Risk</span>;
      case 'MEDIUM':
        return <span className="badge badge-info">Medium Risk</span>;
      case 'HIGH':
        return <span className="badge badge-warning">High Risk</span>;
      case 'CRITICAL':
        return <span className="badge badge-error">Critical</span>;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar
        title="Tool Registry & Security Policies"
        subtitle="Catalog of sandboxed tools, policy-based approvals, and secret redaction rules"
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Registered Tools</span>
              <Wrench size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>6 Tools</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px' }}>100% sandboxed execution</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Total Invocations</span>
              <Terminal size={16} color="var(--color-ai)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>0 Calls</div>
            <div style={{ fontSize: '11px', color: 'var(--color-ai)', marginTop: '4px' }}>Awaiting pipeline execution</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Redacted Secrets</span>
              <ShieldCheck size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>100% Sanitized</div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>0 leaks detected</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Gated Actions</span>
              <Lock size={16} color="var(--color-warning)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>1 Active Gate</div>
            <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>PR creation requires sign-off</div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {['all', 'github', 'browser', 'visual', 'aem', 'security'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`btn btn-sm ${filter === cat ? 'btn-primary' : 'btn-ghost'}`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 30px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Tools Table */}
        <div className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tool Identifier</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Risk Tier</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Human Gate</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Calls</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Last Executed</th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.map((tool) => (
                <tr key={tool.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{tool.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{tool.description}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    {tool.category}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {getRiskBadge(tool.riskLevel)}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {tool.approvalRequired ? (
                      <span style={{ fontSize: '11px', color: 'var(--color-warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={12} /> Requires Approval
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Autonomous
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {tool.totalCalls.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                    {tool.lastExecuted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

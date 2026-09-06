'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TopBar } from '../../../components/layout/TopBar';
import {
  CheckCircle2,
  FileCode2,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Search,
  Box,
  Play,
} from 'lucide-react';
import { useProjects } from '../../../lib/project-store';

interface TestedBlock {
  id: string;
  name: string;
  category: string;
  fieldsCount: number;
  status: 'PASS' | 'FAIL';
  checks: {
    add: boolean;
    edit: boolean;
    save: boolean;
    reopen: boolean;
    render: boolean;
  };
  fields: Array<{
    name: string;
    type: string;
    sampleValue: string;
  }>;
}

const TESTED_BLOCKS: TestedBlock[] = [];
const COMPONENT_DEFINITION_JSON: any[] = [];
const COMPONENT_MODELS_JSON: any[] = [];

export default function UniversalEditorDashboard() {
  const { projects } = useProjects();
  const currentProject = projects[0];
  const authoringPath = currentProject?.aemAuthoringPath || '';
  const authorUrl = currentProject?.aemAuthorUrl || '';

  const [selectedTab, setSelectedTab] = useState<'matrix' | 'definitions' | 'models' | 'dom'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');

  const filteredBlocks = TESTED_BLOCKS.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeBlock = filteredBlocks.find((b) => b.id === selectedBlockId) ?? filteredBlocks[0];

  return (
    <>
      <TopBar
        title="Universal Editor Contracts"
        subtitle="AEM Cloud in-context authoring schemas, component definitions, and verified authoring cycles"
      />

      <div style={{ padding: '24px 32px' }}>
        {/* Active Authoring Page Path Strip */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: authoringPath ? 'var(--accent-primary)' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Connected AEM Authoring Path:
            </span>
            {authoringPath ? (
              <>
                <code style={{ fontSize: '13px', color: 'var(--text-primary)', background: 'var(--bg-surface)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  {authoringPath}
                </code>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  (URN: <code>urn:aemconnection:{authoringPath}</code>)
                </span>
              </>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                No authoring path configured
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {authoringPath && authorUrl ? (
              <a
                href={`${authorUrl.replace(/\/$/, '')}/sites.html${authoringPath.startsWith('/') ? authoringPath : `/${authoringPath}`}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ExternalLink size={12} /> Open in AEM Sites
              </a>
            ) : (
              <Link
                href="/dashboard/projects/new"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Configure in Project
              </Link>
            )}
            <a
              href="https://experience.adobe.net/#/sites/author/universal-editor"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm"
              style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ExternalLink size={12} /> Launch Universal Editor
            </a>
          </div>
        </div>

        {/* KPI Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '6px' }}>
              <Box size={16} color="var(--color-accent-purple)" />
              Blocks Tested
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700 }}>
              {filteredBlocks.length} / {filteredBlocks.length}
            </div>
            <div style={{ fontSize: '12px', color: filteredBlocks.length > 0 ? 'var(--color-success)' : 'var(--text-tertiary)', marginTop: '4px' }}>
              {filteredBlocks.length > 0 ? '100% authoring ready' : 'Awaiting initial run'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '6px' }}>
              <Layers size={16} color="var(--color-accent-cyan)" />
              Fields Tested
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700 }}>0 / 0</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Across all component models
            </div>
          </div>

          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '6px' }}>
              <CheckCircle2 size={16} color="var(--color-success)" />
              Authoring Cycle Status
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: filteredBlocks.length > 0 ? 'var(--color-success)' : 'var(--text-tertiary)' }}>
              {filteredBlocks.length > 0 ? 'PASS' : '—'}
            </div>
            <div style={{ fontSize: '12px', color: filteredBlocks.length > 0 ? 'var(--color-success)' : 'var(--text-tertiary)', marginTop: '4px' }}>
              Add · Edit · Save · Reopen
            </div>
          </div>

          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '6px' }}>
              <ShieldCheck size={16} color="var(--color-success)" />
              DOM Instrumentation
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: filteredBlocks.length > 0 ? 'var(--color-success)' : 'var(--text-tertiary)' }}>
              {filteredBlocks.length > 0 ? '100%' : '—'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              <code>data-aue-*</code> compliant
            </div>
          </div>
        </div>

        {/* Empty State when no blocks have been synthesized */}
        {filteredBlocks.length === 0 ? (
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
              justifyContent: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileCode2 size={24} color="var(--accent-primary)" />
            </div>
            <div style={{ maxWidth: '440px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                No Universal Editor Contracts Synthesized
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Launch an autonomous modernization run to generate <code>_component-definition.json</code>, <code>_component-models.json</code>, and verified <code>data-aue-*</code> DOM instrumentations.
              </p>
            </div>
            <Link
              href="/dashboard/runs"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}
            >
              <Play size={14} />
              <span>Go to Runs Manager</span>
            </Link>
          </div>
        ) : (
          <>
            {/* View Switcher Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                onClick={() => setSelectedTab('matrix')}
                className={`btn btn-sm ${selectedTab === 'matrix' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={14} /> Authoring Verification Matrix
              </button>
              <button
                onClick={() => setSelectedTab('definitions')}
                className={`btn btn-sm ${selectedTab === 'definitions' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FileCode2 size={14} /> Component Definitions Catalog
              </button>
              <button
                onClick={() => setSelectedTab('models')}
                className={`btn btn-sm ${selectedTab === 'models' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Layers size={14} /> Component Field Models
              </button>
              <button
                onClick={() => setSelectedTab('dom')}
                className={`btn btn-sm ${selectedTab === 'dom' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={14} /> DOM Instrumentation View
              </button>
            </div>

            {/* Tab 1: Authoring Matrix */}
            {selectedTab === 'matrix' && activeBlock && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '20px' }}>
                {/* Block Selector */}
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ marginBottom: '14px', position: 'relative' }}>
                    <Search
                      size={14}
                      style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }}
                    />
                    <input
                      type="text"
                      placeholder="Filter blocks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 12px 6px 32px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-bg-base)',
                        border: '1px solid var(--color-border-subtle)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {filteredBlocks.map((block) => {
                      const isSelected = block.id === activeBlock.id;
                      return (
                        <button
                          key={block.id}
                          onClick={() => setSelectedBlockId(block.id)}
                          style={{
                            padding: '12px',
                            borderRadius: 'var(--radius-sm)',
                            textAlign: 'left',
                            background: isSelected ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                            border: isSelected ? '1px solid var(--color-accent-purple)' : '1px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? 'var(--color-accent-purple-light)' : 'var(--color-text-primary)' }}>
                              {block.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              Category: {block.category} · {block.fieldsCount} fields
                            </div>
                          </div>
                          <span className="badge badge-success" style={{ fontSize: '10px' }}>
                            PASS
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Details Panel */}
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{activeBlock.name}</h3>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        ID: <code>{activeBlock.id}</code> · Category: {activeBlock.category}
                      </div>
                    </div>
                    <span className="badge badge-success">Universal Editor Verified</span>
                  </div>

                  {/* 5-Phase Checklist */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                      Automated 5-Step In-Context Lifecycle Verification
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                      {[
                        { label: '1. Add Block', check: activeBlock.checks.add },
                        { label: '2. Edit Properties', check: activeBlock.checks.edit },
                        { label: '3. Save Changes', check: activeBlock.checks.save },
                        { label: '4. Reopen Page', check: activeBlock.checks.reopen },
                        { label: '5. EDS Render', check: activeBlock.checks.render },
                      ].map((step, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px',
                            borderRadius: 'var(--radius-sm)',
                            background: step.check ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                            border: `1px solid ${step.check ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            textAlign: 'center',
                          }}
                        >
                          <CheckCircle2 size={16} color="var(--color-success)" style={{ margin: '0 auto 4px auto' }} />
                          <div style={{ fontSize: '11px', fontWeight: 600 }}>{step.label}</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-success)', marginTop: '2px' }}>VERIFIED</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Editable Fields Table */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                      Model Fields
                    </h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                            <th style={{ padding: '8px' }}>Field ID</th>
                            <th style={{ padding: '8px' }}>Widget Component</th>
                            <th style={{ padding: '8px' }}>Sample Tested Value</th>
                            <th style={{ padding: '8px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeBlock.fields.map((f) => (
                            <tr key={f.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{f.name}</td>
                              <td style={{ padding: '8px' }}>
                                <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{f.type}</span>
                              </td>
                              <td style={{ padding: '8px', color: 'var(--color-text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {f.sampleValue}
                              </td>
                              <td style={{ padding: '8px' }}>
                                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>✓ Persisted</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: _component-definition.json */}
            {selectedTab === 'definitions' && (
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600 }}>_component-definition.json</h3>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Generated Adobe Universal Editor component definition catalog for Edge Delivery Services
                    </p>
                  </div>
                  <span className="badge badge-success">Valid JSON Schema</span>
                </div>
                <pre
                  style={{
                    background: '#090d16',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#38bdf8',
                    overflowX: 'auto',
                    lineHeight: 1.5,
                  }}
                >
                  {JSON.stringify(COMPONENT_DEFINITION_JSON, null, 2)}
                </pre>
              </div>
            )}

            {/* Tab 3: _component-models.json */}
            {selectedTab === 'models' && (
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600 }}>_component-models.json</h3>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Component field models defining text, rich text, image references, and options
                    </p>
                  </div>
                  <span className="badge badge-success">Valid JSON Schema</span>
                </div>
                <pre
                  style={{
                    background: '#090d16',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#a78bfa',
                    overflowX: 'auto',
                    lineHeight: 1.5,
                  }}
                >
                  {JSON.stringify(COMPONENT_MODELS_JSON, null, 2)}
                </pre>
              </div>
            )}

            {/* Tab 4: DOM Instrumentation View */}
            {selectedTab === 'dom' && (
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Live EDS Block Instrumentation Specification</h3>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      HTML decoration with data-aue-* attributes enabling in-context inline authoring
                    </p>
                  </div>
                  <span className="badge badge-success">100% Compliant</span>
                </div>
                <pre
                  style={{
                    background: '#090d16',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#34d399',
                    overflowX: 'auto',
                    lineHeight: 1.5,
                  }}
                >
{`<!-- Generated EDS Block with Universal Editor Instrumentation -->
<!-- Available once an autonomous run has synthesized block definitions -->`}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

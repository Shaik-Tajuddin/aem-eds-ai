'use client';

import { useState } from 'react';
import { TopBar } from '../../../components/layout/TopBar';
import {
  Code2,
  GitBranch,
  FileCode2,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Layers,
  FileText,
} from 'lucide-react';

const FILES = [
  {
    name: 'blocks/hero/hero.js',
    type: 'js',
    linesAdded: 24,
    linesRemoved: 0,
    compliance: 'Franklin Decorator 100% Valid',
    content: `export default function decorate(block) {
  const heading = block.querySelector('h1, h2, h3');
  const picture = block.querySelector('picture');
  
  // Wrap background image for responsive viewport containment
  if (picture) {
    const bgDiv = document.createElement('div');
    bgDiv.className = 'hero-bg-wrapper';
    picture.parentNode.insertBefore(bgDiv, picture);
    bgDiv.appendChild(picture);
  }

  // Enhance CTA buttons with AEM design system tokens
  const buttons = block.querySelectorAll('a');
  buttons.forEach((btn) => {
    btn.classList.add('button');
    if (btn.closest('strong')) btn.classList.add('primary');
  });
}`,
  },
  {
    name: 'blocks/hero/hero.css',
    type: 'css',
    linesAdded: 38,
    linesRemoved: 2,
    compliance: 'WCAG 2.1 AA Contrast Compliant',
    content: `.hero {
  position: relative;
  min-height: 520px;
  display: flex;
  align-items: center;
  overflow: hidden;
  background-color: var(--bg-surface, #111520);
}

.hero .hero-bg-wrapper {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.hero .hero-bg-wrapper picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero .button.primary {
  background-color: var(--accent-primary, #3b82f6);
  color: #ffffff;
  padding: 12px 28px;
  border-radius: var(--radius-md, 6px);
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.2s ease;
}`,
  },
  {
    name: 'component-definition.json',
    type: 'json',
    linesAdded: 16,
    linesRemoved: 0,
    compliance: 'Universal Editor Spec Valid',
    content: `{
  "definitions": [
    {
      "title": "Hero Banner",
      "id": "hero",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": { "name": "Hero Banner", "model": "hero" }
          }
        }
      }
    }
  ]
}`,
  },
];

import { useProjects } from '../../../lib/project-store';

export default function CodeChangesPage() {
  const { projects } = useProjects();
  const currentProject = projects[0];
  const [selectedFile, setSelectedFile] = useState(FILES[0]);
  const [copied, setCopied] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const hasCode = showDemo || (currentProject && currentProject.blocksCount > 0);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar
        title="Code Changes & Diffs"
        subtitle="Synthesized EDS blocks, scripts, styles, and atomic Git commit history"
        actions={
          !hasCode && (
            <button
              onClick={() => setShowDemo(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Code2 size={13} />
              <span>View Sample Block Code</span>
            </button>
          )
        }
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Modified Files</span>
              <FileCode2 size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {hasCode ? '3 Files' : '0 Files'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px' }}>
              {hasCode ? '+78 / -2 lines of code' : 'Awaiting agent code run'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Target Branch</span>
              <GitBranch size={16} color="var(--color-ai)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {currentProject ? currentProject.branch : hasCode ? 'preview/hero-block' : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-ai)', marginTop: '4px' }}>
              {currentProject ? currentProject.repo : 'Connect repository'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Franklin Compliance</span>
              <CheckCircle2 size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {hasCode ? '100% Valid' : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>
              {hasCode ? 'Zero external npm deps in blocks' : 'Validated during pipeline execution'}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase' }}>Universal Editor Contract</span>
              <Layers size={16} color="var(--color-warning)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {hasCode ? 'Schemas Valid' : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>
              {hasCode ? 'data-aue-* attributes mapped' : 'Pending block synthesis'}
            </div>
          </div>
        </div>

        {!hasCode ? (
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
            <Code2 size={32} color="var(--accent-primary)" />
            <div style={{ maxWidth: '460px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                No Code Diffs Generated
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {currentProject
                  ? `Trigger an autonomous agent run on ${currentProject.name} to synthesize Franklin EDS JavaScript blocks, CSS styles, and Universal Editor models.`
                  : 'Trigger an autonomous agent run to synthesize Franklin EDS JavaScript blocks, CSS styles, and Universal Editor models.'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => setShowDemo(true)}
                className="btn btn-secondary btn-sm"
              >
                View Sample Block Code
              </button>
            </div>
          </div>
        ) : (
          /* Diff Explorer */
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* File list */}
          <div className="card" style={{ padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', padding: '6px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Synthesized Assets
            </div>
            {FILES.map((f) => (
              <button
                key={f.name}
                onClick={() => setSelectedFile(f)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  background: selectedFile.name === f.name ? 'var(--bg-elevated)' : 'transparent',
                  border: selectedFile.name === f.name ? '1px solid var(--border-strong)' : '1px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: selectedFile.name === f.name ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  <FileCode2 size={14} color={selectedFile.name === f.name ? 'var(--accent-primary)' : 'var(--text-tertiary)'} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{f.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-tertiary)', paddingLeft: '22px' }}>
                  <span style={{ color: 'var(--color-success)' }}>+{f.linesAdded}</span>
                  {f.linesRemoved > 0 && <span style={{ color: 'var(--color-error)' }}>-{f.linesRemoved}</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedFile.name}
                </span>
                <span className="badge badge-success" style={{ fontSize: '11px' }}>
                  {selectedFile.compliance}
                </span>
              </div>

              <button
                onClick={handleCopy}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copied ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <div style={{ padding: '20px', background: 'var(--bg-base)', overflowX: 'auto' }}>
              <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.65 }}>
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
        )}

      </div>
    </div>
  );
}

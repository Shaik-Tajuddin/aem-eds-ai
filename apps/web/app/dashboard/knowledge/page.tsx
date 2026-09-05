'use client';

import { useState, useMemo } from 'react';
import { TopBar } from '../../../components/layout/TopBar';
import {
  Database,
  Search,
  Sparkles,
  FileCode2,
  BookOpen,
  CheckCircle2,
  SlidersHorizontal,
  Code2,
  Layers,
  ArrowUpDown,
  Filter,
  Terminal,
  RefreshCw,
  Plus,
  ExternalLink,
  ChevronRight,
  Info,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

interface KnowledgeDocItem {
  id: string;
  title: string;
  source: string;
  sourceType: 'project-code' | 'project-docs' | 'standards' | 'eds-docs' | 'aem-docs';
  chunksCount: number;
  tokensCount: number;
  updatedAt: string;
  status: 'indexed' | 'syncing';
}

interface SimulatedChunk {
  id: string;
  title: string;
  source: string;
  sourceType: 'project-code' | 'project-docs' | 'standards' | 'eds-docs' | 'aem-docs';
  heading: string;
  language: string;
  codeSnippet: string;
  keywords: string[];
  baseSimilarity: number;
}

const SOURCE_WEIGHTS: Record<string, { weight: number; label: string; color: string }> = {
  'project-code': { weight: 1.25, label: 'Project Code (1.25x)', color: '#10b981' },
  'project-docs': { weight: 1.15, label: 'Project Docs (1.15x)', color: '#06b6d4' },
  standards: { weight: 1.10, label: 'Standards (1.10x)', color: '#3b82f6' },
  'eds-docs': { weight: 1.05, label: 'EDS Docs (1.05x)', color: '#8b5cf6' },
  'aem-docs': { weight: 1.05, label: 'AEM Docs (1.05x)', color: '#f59e0b' },
};

const KNOWLEDGE_DOCS: KnowledgeDocItem[] = [
  {
    id: 'doc-1',
    title: 'Hero Block Decorator & Auto-Picture',
    source: 'blocks/hero/hero.js',
    sourceType: 'project-code',
    chunksCount: 6,
    tokensCount: 1420,
    updatedAt: '2026-09-06 04:30',
    status: 'indexed',
  },
  {
    id: 'doc-2',
    title: 'Cards Block Component & Grid Layout',
    source: 'blocks/cards/cards.js',
    sourceType: 'project-code',
    chunksCount: 8,
    tokensCount: 1890,
    updatedAt: '2026-09-06 04:15',
    status: 'indexed',
  },
  {
    id: 'doc-3',
    title: 'Header Navigation & Mobile Drawer',
    source: 'blocks/header/header.js',
    sourceType: 'project-code',
    chunksCount: 12,
    tokensCount: 2650,
    updatedAt: '2026-09-06 03:40',
    status: 'indexed',
  },
  {
    id: 'doc-4',
    title: 'Franklin Design System Tokens & Typography',
    source: 'styles/styles.css',
    sourceType: 'standards',
    chunksCount: 14,
    tokensCount: 3200,
    updatedAt: '2026-09-06 02:00',
    status: 'indexed',
  },
  {
    id: 'doc-5',
    title: 'EDS Block Conventions & Decorate Lifecycle',
    source: 'docs/eds-block-authoring.md',
    sourceType: 'standards',
    chunksCount: 9,
    tokensCount: 2150,
    updatedAt: '2026-09-05 23:30',
    status: 'indexed',
  },
  {
    id: 'doc-6',
    title: 'Adobe Edge Delivery Services DOM Structure',
    source: 'adobe/aem-eds-specs.md',
    sourceType: 'eds-docs',
    chunksCount: 18,
    tokensCount: 4500,
    updatedAt: '2026-09-05 21:10',
    status: 'indexed',
  },
  {
    id: 'doc-7',
    title: 'Universal Editor Component Models & Contract',
    source: 'models/ue-models.json',
    sourceType: 'aem-docs',
    chunksCount: 15,
    tokensCount: 3800,
    updatedAt: '2026-09-05 20:00',
    status: 'indexed',
  },
];

const SIMULATED_CHUNKS: SimulatedChunk[] = [
  {
    id: 'chunk-1',
    title: 'Hero Block Decorator',
    source: 'blocks/hero/hero.js',
    sourceType: 'project-code',
    heading: 'Decorator Function & Picture Optimization',
    language: 'javascript',
    keywords: ['hero', 'button', 'banner', 'image', 'picture', 'decorate', 'cta'],
    baseSimilarity: 0.92,
    codeSnippet: `export default function decorate(block) {
  const heading = block.querySelector('h1, h2, h3');
  const picture = block.querySelector('picture');
  if (picture) {
    picture.closest('div')?.classList.add('hero-bg-wrapper');
  }
  const buttons = block.querySelectorAll('a.button');
  buttons.forEach((btn) => btn.classList.add('hero-cta-btn'));
}`,
  },
  {
    id: 'chunk-2',
    title: 'Franklin Design System Tokens',
    source: 'styles/styles.css',
    sourceType: 'standards',
    heading: 'Brand Color Variables & Typography Tokens',
    language: 'css',
    keywords: ['css', 'variables', 'typography', 'color', 'tokens', 'buttons', 'hero'],
    baseSimilarity: 0.88,
    codeSnippet: `:root {
  --heading-font-family: 'Inter', sans-serif;
  --body-font-family: 'Inter', sans-serif;
  --primary-brand-color: #0284c7;
  --primary-accent-hover: #0369a1;
  --btn-border-radius: 8px;
  --container-max-width: 1280px;
}`,
  },
  {
    id: 'chunk-3',
    title: 'Cards Block Component',
    source: 'blocks/cards/cards.js',
    sourceType: 'project-code',
    heading: 'Multi-column Grid & Auto-Layout Normalization',
    language: 'javascript',
    keywords: ['cards', 'grid', 'columns', 'layout', 'decorate'],
    baseSimilarity: 0.81,
    codeSnippet: `export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
}`,
  },
  {
    id: 'chunk-4',
    title: 'Universal Editor Component Models',
    source: 'models/ue-models.json',
    sourceType: 'aem-docs',
    heading: 'Hero Component Definition & Authoring Fields',
    language: 'json',
    keywords: ['universal editor', 'schema', 'models', 'hero', 'fields', 'authoring'],
    baseSimilarity: 0.84,
    codeSnippet: `{
  "id": "hero",
  "fields": [
    { "component": "text", "name": "title", "label": "Headline", "valueType": "string" },
    { "component": "reference", "name": "image", "label": "Hero Image", "valueType": "string" },
    { "component": "aem-content", "name": "ctaUrl", "label": "Call To Action Target" }
  ]
}`,
  },
  {
    id: 'chunk-5',
    title: 'EDS Block Conventions',
    source: 'docs/eds-block-authoring.md',
    sourceType: 'standards',
    heading: 'Block DOM Decoration Rules & Lifecycle',
    language: 'markdown',
    keywords: ['eds', 'block', 'decorate', 'lifecycle', 'dom', 'franklin'],
    baseSimilarity: 0.85,
    codeSnippet: `### Block Lifecycle in Edge Delivery Services:
1. Franklin loader scans page DOM for \`.block\` elements.
2. Dynamically imports \`/blocks/{blockName}/{blockName}.js\`.
3. Calls \`decorate(blockEl)\` passing the root DOM container.
4. Loads companion stylesheet \`/blocks/{blockName}/{blockName}.css\`.`,
  },
];

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState('hero block with buttons');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('all');
  const [applyWeights, setApplyWeights] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'search' | 'catalog' | 'prompt'>('search');
  const [copied, setCopied] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);

  // Compute retrieval results based on search query and weights
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const queryTokens = q.split(/\s+/).filter(Boolean);

    return SIMULATED_CHUNKS.map((chunk) => {
      let matchCount = 0;
      for (const token of queryTokens) {
        if (
          chunk.keywords.some((k) => k.includes(token) || token.includes(k)) ||
          chunk.title.toLowerCase().includes(token) ||
          chunk.heading.toLowerCase().includes(token) ||
          chunk.codeSnippet.toLowerCase().includes(token)
        ) {
          matchCount++;
        }
      }

      const matchRatio = queryTokens.length > 0 ? matchCount / queryTokens.length : 0.5;
      const rawSim = Math.min(0.99, Math.max(0.3, chunk.baseSimilarity * 0.55 + matchRatio * 0.45));
      const sourceWeight = applyWeights ? (SOURCE_WEIGHTS[chunk.sourceType]?.weight ?? 1.0) : 1.0;
      const weightedScore = Math.min(1.0, rawSim * (sourceWeight >= 1.0 ? 1 + (sourceWeight - 1) * 0.4 : sourceWeight));

      return {
        chunk,
        rawSimilarity: rawSim,
        sourceWeight,
        weightedScore,
      };
    })
      .filter((item) => selectedSourceType === 'all' || item.chunk.sourceType === selectedSourceType)
      .sort((a, b) => b.weightedScore - a.weightedScore);
  }, [searchQuery, selectedSourceType, applyWeights]);

  const handleCopyPrompt = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReindex = () => {
    setIsReindexing(true);
    setTimeout(() => setIsReindexing(false), 1200);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar
        title="Knowledge Retrieval (RAG & pgvector)"
        subtitle="Authoritative semantic retrieval engine with 768-dim embeddings and hierarchical source weighting"
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Indexed Documents</span>
              <BookOpen size={16} color="#06b6d4" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>7 Docs</div>
            <div style={{ fontSize: '11px', color: '#06b6d4', marginTop: '4px' }}>Project code, standards & docs</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vector Chunks</span>
              <Database size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>82 Chunks</div>
            <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>768-dim pgvector HNSW index</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority Multiplier</span>
              <Layers size={16} color="#a855f7" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>1.25x Code</div>
            <div style={{ fontSize: '11px', color: '#a855f7', marginTop: '4px' }}>Hierarchical: Code &gt; Docs &gt; Standards</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query Latency</span>
              <Zap size={16} color="#eab308" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>12 ms</div>
            <div style={{ fontSize: '11px', color: '#eab308', marginTop: '4px' }}>Cosine vector distance &lt;= 0.15</div>
          </div>
        </div>

        {/* Tab & Action Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('search')}
              className={`btn btn-sm ${activeTab === 'search' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Search size={14} />
              <span>Semantic Retrieval Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`btn btn-sm ${activeTab === 'catalog' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <BookOpen size={14} />
              <span>Knowledge Document Catalog</span>
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`btn btn-sm ${activeTab === 'prompt' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Terminal size={14} />
              <span>LLM Prompt Injection Preview</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={applyWeights}
                onChange={(e) => setApplyWeights(e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <span>Apply Hierarchical Priority Weights</span>
            </label>

            <button
              onClick={handleReindex}
              disabled={isReindexing}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={isReindexing ? 'animate-spin' : ''} />
              <span>{isReindexing ? 'Reindexing...' : 'Sync pgvector'}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Semantic Retrieval Simulator */}
        {activeTab === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Search Input Box */}
            <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter semantic query (e.g. 'hero block with buttons', 'CSS typography design tokens')..."
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 42px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'var(--font-ui)',
                  }}
                />
              </div>

              {/* Quick Preset Queries */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Example Queries:</span>
                {[
                  'hero block with buttons',
                  'cards block grid decorate',
                  'CSS variables typography design tokens',
                  'Universal Editor hero component schema',
                  'EDS block lifecycle DOM rules',
                ].map((qText) => (
                  <button
                    key={qText}
                    onClick={() => setSearchQuery(qText)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: searchQuery === qText ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    {qText}
                  </button>
                ))}
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Filter size={12} />
                  <span>Source Filter:</span>
                </span>
                {['all', 'project-code', 'standards', 'eds-docs', 'aem-docs'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedSourceType(st)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: selectedSourceType === st ? 'var(--color-info-dim)' : 'transparent',
                      color: selectedSourceType === st ? 'var(--color-info)' : 'var(--text-secondary)',
                      border: selectedSourceType === st ? '1px solid var(--color-info)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    {st === 'all' ? 'All Sources' : SOURCE_WEIGHTS[st]?.label || st}
                  </button>
                ))}
              </div>
            </div>

            {/* Retrieval Result Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                <span>Retrieved <strong>{searchResults.length}</strong> matching vector chunks (sorted by {applyWeights ? 'Weighted Score' : 'Cosine Similarity'})</span>
                <span>pgvector Top-K = 5</span>
              </div>

              {searchResults.map((item, idx) => {
                const badgeColor = SOURCE_WEIGHTS[item.chunk.sourceType]?.color || '#3b82f6';
                return (
                  <div
                    key={item.chunk.id}
                    className="card"
                    style={{
                      padding: '18px 22px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                          #{idx + 1}
                        </span>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.chunk.title}
                        </h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          &gt; {item.chunk.heading}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: 'var(--font-mono)',
                            color: badgeColor,
                            background: `${badgeColor}18`,
                            border: `1px solid ${badgeColor}33`,
                          }}
                        >
                          {item.chunk.sourceType} ({item.sourceWeight}x)
                        </span>

                        <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            Raw Sim: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{(item.rawSimilarity * 100).toFixed(1)}%</span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                            {(item.weightedScore * 100).toFixed(1)}% Score
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      <FileCode2 size={13} color="var(--text-tertiary)" />
                      <span>{item.chunk.source}</span>
                    </div>

                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        overflowX: 'auto',
                      }}
                    >
                      <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                        <code>{item.chunk.codeSnippet}</code>
                      </pre>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Knowledge Document Catalog */}
        {activeTab === 'catalog' && (
          <div className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Ingested Knowledge Documents</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>All active documents embedded and indexed into the PostgreSQL pgvector database</p>
              </div>
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={12} />
                <span>All Documents Synced</span>
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Document Title</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Source Path</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Source Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Chunks</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Tokens</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {KNOWLEDGE_DOCS.map((doc) => {
                    const badgeColor = SOURCE_WEIGHTS[doc.sourceType]?.color || '#3b82f6';
                    return (
                      <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BookOpen size={15} color="#06b6d4" />
                            <span>{doc.title}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                          {doc.source}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '11px',
                              fontWeight: 600,
                              fontFamily: 'var(--font-mono)',
                              color: badgeColor,
                              background: `${badgeColor}18`,
                              border: `1px solid ${badgeColor}33`,
                            }}
                          >
                            {doc.sourceType}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {doc.chunksCount}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {doc.tokensCount.toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                          {doc.updatedAt}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LLM Prompt Injection Preview */}
        {activeTab === 'prompt' && (
          <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Autonomous Developer System Prompt Injection</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Pre-compiled semantic context injected into the Claude / GPT-4o / Ollama prompt before execution
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-info" style={{ fontFamily: 'var(--font-mono)' }}>~1,240 Prompt Tokens</span>
                <button
                  onClick={handleCopyPrompt}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copied ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy Context'}</span>
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '16px 20px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflowX: 'auto',
              }}
            >
              <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
{`### AEM / EDS Knowledge & Standards Context
The following authoritative project code, standards, and documentation should inform the implementation:

#### [1] Source: Hero Block Decorator > Decorator Function & Picture Optimization (Type: project-code, Relevance: 98.4%)
Reference: \`blocks/hero/hero.js\`
\`\`\`javascript
export default function decorate(block) {
  const heading = block.querySelector('h1, h2, h3');
  const picture = block.querySelector('picture');
  if (picture) {
    picture.closest('div')?.classList.add('hero-bg-wrapper');
  }
  const buttons = block.querySelectorAll('a.button');
  buttons.forEach((btn) => btn.classList.add('hero-cta-btn'));
}
\`\`\`

#### [2] Source: Franklin Design System Tokens > Brand Color Variables & Typography Tokens (Type: standards, Relevance: 93.5%)
Reference: \`styles/styles.css\`
\`\`\`css
:root {
  --heading-font-family: 'Inter', sans-serif;
  --body-font-family: 'Inter', sans-serif;
  --primary-brand-color: #0284c7;
  --primary-accent-hover: #0369a1;
  --btn-border-radius: 8px;
  --container-max-width: 1280px;
}
\`\`\`

#### [3] Source: Universal Editor Component Models > Hero Component Definition & Schema (Type: aem-docs, Relevance: 84.1%)
Reference: \`models/ue-models.json\`
\`\`\`json
{
  "id": "hero",
  "fields": [
    { "component": "text", "name": "title", "label": "Headline" },
    { "component": "reference", "name": "image", "label": "Hero Image" },
    { "component": "aem-content", "name": "ctaUrl", "label": "Call To Action Target" }
  ]
}
\`\`\``}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

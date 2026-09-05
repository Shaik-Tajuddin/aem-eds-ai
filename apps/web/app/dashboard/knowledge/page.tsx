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
} from 'lucide-react';

interface KnowledgeDocItem {
  id: string;
  title: string;
  source: string;
  sourceType: 'project-code' | 'project-docs' | 'standards' | 'eds-docs' | 'aem-docs' | 'general';
  chunksCount: number;
  tokensCount: number;
  updatedAt: string;
}

interface SimulatedChunk {
  id: string;
  title: string;
  source: string;
  sourceType: 'project-code' | 'project-docs' | 'standards' | 'eds-docs' | 'aem-docs' | 'general';
  heading: string;
  language?: string;
  codeSnippet: string;
  keywords: string[];
  baseSimilarity: number;
}

const SOURCE_WEIGHTS: Record<string, number> = {
  'project-code': 1.25,
  'project-docs': 1.15,
  standards: 1.10,
  'eds-docs': 1.05,
  'aem-docs': 1.05,
  general: 1.0,
};

const KNOWLEDGE_DOCS: KnowledgeDocItem[] = [
  {
    id: 'doc-1',
    title: 'Hero Block Decorator',
    source: 'blocks/hero/hero.js',
    sourceType: 'project-code',
    chunksCount: 6,
    tokensCount: 1420,
    updatedAt: '2026-09-05 18:20',
  },
  {
    id: 'doc-2',
    title: 'Cards Block Component',
    source: 'blocks/cards/cards.js',
    sourceType: 'project-code',
    chunksCount: 8,
    tokensCount: 1890,
    updatedAt: '2026-09-05 19:15',
  },
  {
    id: 'doc-3',
    title: 'Header Navigation & Hamburger',
    source: 'blocks/header/header.js',
    sourceType: 'project-code',
    chunksCount: 12,
    tokensCount: 2650,
    updatedAt: '2026-09-05 19:40',
  },
  {
    id: 'doc-4',
    title: 'Franklin Design System Tokens',
    source: 'styles/styles.css',
    sourceType: 'standards',
    chunksCount: 14,
    tokensCount: 3200,
    updatedAt: '2026-09-05 17:00',
  },
  {
    id: 'doc-5',
    title: 'EDS Block Conventions & Decorate Lifecycle',
    source: 'docs/eds-block-authoring.md',
    sourceType: 'standards',
    chunksCount: 9,
    tokensCount: 2150,
    updatedAt: '2026-09-05 16:30',
  },
  {
    id: 'doc-6',
    title: 'Adobe Edge Delivery Services DOM Structure',
    source: 'adobe/aem-eds-specs.md',
    sourceType: 'eds-docs',
    chunksCount: 18,
    tokensCount: 4500,
    updatedAt: '2026-09-05 15:10',
  },
  {
    id: 'doc-7',
    title: 'Universal Editor Component Models & Contract',
    source: 'models/ue-models.json',
    sourceType: 'aem-docs',
    chunksCount: 15,
    tokensCount: 3800,
    updatedAt: '2026-09-05 20:00',
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
    keywords: ['hero', 'button', 'banner', 'image', 'picture', 'decorate'],
    baseSimilarity: 0.89,
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
    keywords: ['css', 'variables', 'typography', 'color', 'tokens', 'buttons'],
    baseSimilarity: 0.85,
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
    heading: 'Hero Component Definition & Schema',
    language: 'json',
    keywords: ['universal editor', 'schema', 'models', 'hero', 'fields'],
    baseSimilarity: 0.79,
    codeSnippet: `{
  "id": "hero",
  "fields": [
    { "component": "text", "name": "title", "label": "Title" },
    { "component": "reference", "name": "image", "label": "Background Image" },
    { "component": "aem-content", "name": "ctaUrl", "label": "Call To Action" }
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
    baseSimilarity: 0.83,
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

  // Compute retrieval results based on search query and weights
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const queryTokens = q.split(/\s+/).filter(Boolean);

    return SIMULATED_CHUNKS.map((chunk) => {
      // Calculate token match ratio
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
      const rawSim = Math.min(0.98, Math.max(0.2, chunk.baseSimilarity * 0.5 + matchRatio * 0.5));
      const sourceWeight = applyWeights ? (SOURCE_WEIGHTS[chunk.sourceType] ?? 1.0) : 1.0;
      const weightedScore = rawSim * sourceWeight;

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

  const sourcePillClass = (type: string) => {
    switch (type) {
      case 'project-code':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'standards':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'eds-docs':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'aem-docs':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <>
      <TopBar
        title="Knowledge Retrieval (RAG & pgvector)"
        subtitle="Authoritative semantic retrieval engine with 768-dim embeddings and hierarchical source weighting"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Indexed Documents</span>
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">7 Docs</div>
            <div className="text-xs text-cyan-400/80 mt-1">Project code, standards & docs</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Vector Chunks</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">82 Chunks</div>
            <div className="text-xs text-emerald-400/80 mt-1">768-dim pgvector index</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Source Priority Multiplier</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">1.25x Code</div>
            <div className="text-xs text-purple-400/80 mt-1">1.25x &gt; 1.15x &gt; 1.10x &gt; 1.05x</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Retrieval Latency</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">14 ms</div>
            <div className="text-xs text-amber-400/80 mt-1">Cosine vector distance</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                activeTab === 'search'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Semantic Retrieval Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                activeTab === 'catalog'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Knowledge Document Catalog</span>
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                activeTab === 'prompt'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>LLM Prompt Injection Preview</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyWeights}
                onChange={(e) => setApplyWeights(e.target.checked)}
                className="w-4 h-4 text-cyan-500 rounded border-slate-700 bg-slate-800 focus:ring-cyan-500/40"
              />
              <span>Apply Hierarchical Priority Weights</span>
            </label>
          </div>
        </div>

        {/* TAB 1: Semantic Retrieval Simulator */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter semantic query e.g. 'hero block with buttons', 'CSS typography tokens'..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              {/* Quick Pills */}
              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                <span className="text-xs text-slate-500">Quick queries:</span>
                {[
                  'hero block with buttons',
                  'cards block grid decorate',
                  'CSS variables typography design tokens',
                  'Universal Editor hero component schema',
                  'EDS block lifecycle DOM rules',
                ].map((queryText) => (
                  <button
                    key={queryText}
                    onClick={() => setSearchQuery(queryText)}
                    className="text-xs px-2.5 py-1 bg-slate-800/70 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-700/60 transition-colors"
                  >
                    {queryText}
                  </button>
                ))}
              </div>

              {/* Source Filters */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/60 flex-wrap gap-y-2">
                <span className="text-xs text-slate-500 flex items-center space-x-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Source Filter:</span>
                </span>
                {['all', 'project-code', 'standards', 'eds-docs', 'aem-docs'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedSourceType(st)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      selectedSourceType === st
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-medium'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {st} {st !== 'all' && `(${SOURCE_WEIGHTS[st]}x)`}
                  </button>
                ))}
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Retrieved {searchResults.length} matching vector chunks (sorted by{' '}
                  {applyWeights ? 'Weighted Score' : 'Raw Similarity'})
                </span>
                <span className="text-slate-500">Top-K = 5</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {searchResults.map((item, idx) => (
                  <div
                    key={item.chunk.id}
                    className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                        <h3 className="text-sm font-semibold text-slate-100">{item.chunk.title}</h3>
                        <span className="text-xs text-slate-400">&gt; {item.chunk.heading}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border font-mono ${sourcePillClass(
                            item.chunk.sourceType
                          )}`}
                        >
                          {item.chunk.sourceType} ({item.sourceWeight}x)
                        </span>

                        <div className="text-right pl-3 border-l border-slate-800">
                          <div className="text-xs text-slate-400">
                            Raw Sim: <span className="font-mono text-slate-300">{(item.rawSimilarity * 100).toFixed(1)}%</span>
                          </div>
                          <div className="text-sm font-bold text-cyan-400 font-mono">
                            {(item.weightedScore * 100).toFixed(1)}% Score
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 font-mono flex items-center space-x-2">
                      <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.chunk.source}</span>
                    </div>

                    <pre className="p-3.5 rounded-lg bg-slate-950/90 border border-slate-800/80 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                      <code>{item.chunk.codeSnippet}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Knowledge Document Catalog */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th className="p-4">Document Title</th>
                    <th className="p-4">Source Path</th>
                    <th className="p-4">Source Type</th>
                    <th className="p-4 text-center">Chunks</th>
                    <th className="p-4 text-center">Tokens</th>
                    <th className="p-4 text-right">Last Ingested</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {KNOWLEDGE_DOCS.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-medium text-slate-100 flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <span>{doc.title}</span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">{doc.source}</td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border font-mono ${sourcePillClass(
                            doc.sourceType
                          )}`}
                        >
                          {doc.sourceType}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono">{doc.chunksCount}</td>
                      <td className="p-4 text-center font-mono">{doc.tokensCount.toLocaleString()}</td>
                      <td className="p-4 text-right text-slate-400">{doc.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LLM Prompt Injection Preview */}
        {activeTab === 'prompt' && (
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">LLM System Context Injection</h3>
                <p className="text-xs text-slate-400 mt-1">
                  How retrieved vector chunks are formatted and prepended to the autonomous AI developer's prompt:
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded font-mono">
                Tokens: ~1,240
              </span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
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

#### [3] Source: Universal Editor Component Models > Hero Component Definition & Schema (Type: aem-docs, Relevance: 82.9%)
Reference: \`models/ue-models.json\`
\`\`\`json
{
  "id": "hero",
  "fields": [
    { "component": "text", "name": "title", "label": "Title" },
    { "component": "reference", "name": "image", "label": "Background Image" }
  ]
}
\`\`\``}
            </pre>
          </div>
        )}
      </div>
    </>
  );
}

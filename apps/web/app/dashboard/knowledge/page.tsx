'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Eye,
  X,
  FileText,
  Upload,
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
  content: string;
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
    content: `# Hero Block Decorator & Auto-Picture Specification

**Source Path**: \`blocks/hero/hero.js\`  
**Source Type**: Project Code (Weight: 1.25x)  
**Status**: Indexed & Active in pgvector RAG store

---

## 1. Architectural Role & Execution Lifecycle
The Hero block serves as the top-level hero banner in AEM Edge Delivery Services (Franklin). Because it is positioned in the initial viewport, its execution is strictly optimized for **Largest Contentful Paint (LCP)**:
- Must avoid layout shifts (zero CLS) by reserving picture aspect-ratio dimensions.
- Zero npm or runtime dependencies.
- Vanilla ESM JavaScript module exported via \`default export function decorate(block)\`.

---

## 2. Production Source Code
\`\`\`javascript
/**
 * Decorates the hero block.
 * @param {Element} block The hero block element.
 */
export default function decorate(block) {
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
    if (btn.closest('em')) btn.classList.add('secondary');
  });

  // Assign semantic ARIA landmark if hero is the first section
  if (block.closest('.section')?.matches(':first-of-type')) {
    block.setAttribute('role', 'banner');
  }
}
\`\`\`

---

## 3. Companion CSS Rules (\`blocks/hero/hero.css\`)
\`\`\`css
.hero {
  position: relative;
  min-height: 540px;
  display: flex;
  align-items: center;
  overflow: hidden;
  background-color: var(--bg-surface);
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
}
\`\`\`

---

## 4. Authoring Table Schema (Word / Google Docs)
| Hero | |
| --- | --- |
| ![Hero Image](https://example.com/hero.jpg) | # Next-Gen Outdoor Exploration<br>Engineered for alpine expeditions.<br>**[Explore Gear](/shop)** *[Watch Film](/video)* |
`,
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
    content: `# Cards Block Component & Grid Layout Specification

**Source Path**: \`blocks/cards/cards.js\`  
**Source Type**: Project Code (Weight: 1.25x)  
**Status**: Indexed & Active in pgvector RAG store

---

## 1. Architectural Overview
The Cards block transforms row-based tabular authoring into a multi-column CSS grid. It splits author content into image wrappers and card body wrappers, ensuring responsive reflow across desktop, tablet, and mobile.

---

## 2. Production Source Code
\`\`\`javascript
/**
 * Decorates the cards block.
 * @param {Element} block The cards block element.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-card-image';
      } else {
        div.className = 'cards-card-body';
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(img);
  });
  block.textContent = '';
  block.append(ul);
}
\`\`\`

---

## 3. Responsive Grid Styles (\`blocks/cards/cards.css\`)
\`\`\`css
.cards > ul {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.cards > ul > li {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cards > ul > li:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
\`\`\`
`,
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
    content: `# Header Navigation & Mobile Drawer Specification

**Source Path**: \`blocks/header/header.js\`  
**Source Type**: Project Code (Weight: 1.25x)  
**Status**: Indexed & Active in pgvector RAG store

---

## 1. Architectural Role
The Header block asynchronously fetches \`/nav.plain.html\` and builds:
- Brand Logo / Home navigation anchor
- Section navigation links with dropdown hierarchy
- Mobile responsive hamburger toggle with keyboard accessible ARIA attributes
- Utility search and user profile triggers

---

## 2. Production Source Code
\`\`\`javascript
import { getMetadata } from '../../scripts/aem.js';

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const resp = await fetch(\`\${navPath}.plain.html\`);
  if (!resp.ok) return;

  const html = await resp.text();
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.innerHTML = html;

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(\`nav-\${c}\`);
  });

  // Mobile hamburger menu toggle
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = '<button type="button" aria-controls="nav" aria-label="Open navigation"><span class="nav-hamburger-icon"></span></button>';
  hamburger.addEventListener('click', () => {
    const isExpanded = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
    document.body.classList.toggle('nav-open', !isExpanded);
  });
  nav.prepend(hamburger);
  block.append(nav);
}
\`\`\`
`,
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
    content: `# Franklin Design System Tokens & Typography Guide

**Source Path**: \`styles/styles.css\`  
**Source Type**: Standards (Weight: 1.10x)  
**Status**: Indexed & Active in pgvector RAG store

---

## 1. Design Token Architecture
All EDS blocks share standard CSS Custom Properties defined in \`styles/styles.css\`. This prevents ad-hoc color values and guarantees WCAG 2.1 AA compliant contrast ratios.

---

## 2. Core Tokens
\`\`\`css
:root {
  /* Brand Palette */
  --primary-brand-color: #0284c7;
  --primary-accent-hover: #0369a1;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --bg-base: #ffffff;
  --bg-surface: #f8fafc;
  --border-subtle: #e2e8f0;

  /* Typography */
  --heading-font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --body-font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Font Scales */
  --font-size-hero: clamp(36px, 5vw, 64px);
  --font-size-h1: clamp(28px, 4vw, 42px);
  --font-size-h2: clamp(22px, 3vw, 32px);
  --font-size-body: 16px;
  --line-height-body: 1.6;

  /* Layout */
  --container-max-width: 1280px;
  --btn-border-radius: 8px;
  --radius-md: 8px;
}
\`\`\`
`,
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
    content: `# Edge Delivery Services Block Authoring Conventions

**Source Path**: \`docs/eds-block-authoring.md\`  
**Source Type**: Standards (Weight: 1.10x)  
**Status**: Indexed & Active in pgvector RAG store

---

## 1. Block Lifecycle Rules
1. **DOM Structure**: Franklin loader parses page sections into \`<div class="block-name block">\` elements.
2. **Dynamic Import**: Each block file \`/blocks/{blockName}/{blockName}.js\` is dynamically imported on demand.
3. **Execution**: The default exported \`decorate(blockEl)\` function runs, receiving the block container DOM.
4. **Style Sheet**: \`/blocks/{blockName}/{blockName}.css\` is loaded concurrently.
5. **No NPM Runtime Bloat**: Blocks must use vanilla DOM APIs without React, Vue, or lodash runtime dependencies.
6. **Lighthouse Budget**: 100/100 Core Web Vitals target (LCP < 500ms, CLS 0.00, TBT 0ms).
`,
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
    content: `# Adobe Edge Delivery Services DOM Structure & Pipeline Specifications

**Source Path**: \`adobe/aem-eds-specs.md\`  
**Source Type**: EDS Docs (Weight: 1.05x)  
**Status**: Indexed & Active in pgvector RAG store

---

## 1. Edge HTML Ingestion
Content authored in Google Drive (.docx, Sheets) or Microsoft SharePoint is normalized by Helix Admin into semantic HTML:
- Headers become \`<h1>\`-\`<h6>\`
- Bolded links become \`<strong><a class="button"></a></strong>\`
- Tables with 1 cell in row 1 become blocks \`<div class="block-name block">\`
- Rows with metadata become section metadata

---

## 2. CDN Pipeline & Cache Headers
- \`.hlx.page\`: Preview pipeline with automatic Fastly cache invalidation on publication.
- \`.hlx.live\`: Production edge CDN pipeline with global shield caching and stale-while-revalidate.
`,
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
    content: `# Universal Editor Component Models & Authoring Contract

**Source Path**: \`models/ue-models.json\`  
**Source Type**: AEM Docs (Weight: 1.05x)  
**Status**: Indexed & Active in pgvector RAG store

---

## 1. Specification Overview
The Universal Editor contracts allow in-context WYSIWYG editing of EDS blocks on AEM Cloud authoring environments.

\`\`\`json
{
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
  ],
  "models": [
    {
      "id": "hero",
      "fields": [
        { "component": "text", "name": "title", "label": "Headline", "valueType": "string", "required": true },
        { "component": "reference", "name": "image", "label": "Hero Image", "valueType": "string" },
        { "component": "text", "name": "ctaText", "label": "CTA Button Label", "valueType": "string" },
        { "component": "aem-content", "name": "ctaUrl", "label": "CTA Target URL" }
      ]
    }
  ]
}
\`\`\`

---

## 2. In-Context DOM Attributes (\`data-aue-*\`)
Universal Editor uses HTML attributes to highlight editable components:
- \`data-aue-resource\`: urn or path of the content item.
- \`data-aue-type="component"\`: identifies an authorable block.
- \`data-aue-prop="title"\`: maps text element to model property.
`,
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
  const [docs, setDocs] = useState<KnowledgeDocItem[]>(KNOWLEDGE_DOCS);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilterType, setCatalogFilterType] = useState('all');
  const [selectedDocForModal, setSelectedDocForModal] = useState<KnowledgeDocItem | null>(null);
  const [copiedDoc, setCopiedDoc] = useState(false);

  // Ingestion Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    source: '',
    sourceType: 'project-docs' as KnowledgeDocItem['sourceType'],
    content: '',
  });

  const [searchQuery, setSearchQuery] = useState('hero block with buttons');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('all');
  const [applyWeights, setApplyWeights] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'search' | 'prompt'>('catalog');
  const [copied, setCopied] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);

  useEffect(() => {
    fetch('/api/backend/knowledge')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.documents) && data.documents.length > 0) {
          setDocs(
            data.documents.map((d: any) => ({
              id: d.id,
              title: d.title,
              source: d.source,
              sourceType: d.sourceType,
              chunksCount: d.chunksCount ?? Math.max(1, Math.ceil((d.content?.length || 0) / 400)),
              tokensCount: Math.ceil((d.content?.length || 0) / 4),
              updatedAt: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : 'Active',
              status: 'indexed' as const,
              content: d.content || '',
            }))
          );
        }
      })
      .catch((err) => console.warn('Failed to load knowledge documents from backend:', err));
  }, []);

  // Filter catalog docs
  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchesType = catalogFilterType === 'all' || d.sourceType === catalogFilterType;
      const q = catalogSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [docs, catalogFilterType, catalogSearch]);

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
          chunk.source.toLowerCase().includes(token)
        ) {
          matchCount++;
        }
      }

      const matchRatio = queryTokens.length > 0 ? matchCount / queryTokens.length : 0.5;
      const rawSimilarity = Math.min(0.99, Math.max(0.4, Number((chunk.baseSimilarity * 0.4 + matchRatio * 0.6).toFixed(3))));
      const weight = SOURCE_WEIGHTS[chunk.sourceType]?.weight || 1.0;
      const weightedScore = applyWeights ? Number((rawSimilarity * weight).toFixed(3)) : rawSimilarity;

      return {
        chunk,
        rawSimilarity,
        weightedScore,
        sourceWeight: weight,
      };
    })
      .filter((item) => selectedSourceType === 'all' || item.chunk.sourceType === selectedSourceType)
      .sort((a, b) => b.weightedScore - a.weightedScore);
  }, [searchQuery, selectedSourceType, applyWeights]);

  const handleCopyPrompt = () => {
    const topChunks = searchResults.slice(0, 3);
    const formatted = topChunks
      .map((c, i) => `### Reference [${i + 1}]: ${c.chunk.title} (${c.chunk.source})\n\`\`\`${c.chunk.language}\n${c.chunk.codeSnippet}\n\`\`\``)
      .join('\n\n');
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyDocContent = () => {
    if (!selectedDocForModal) return;
    navigator.clipboard.writeText(selectedDocForModal.content);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  const handleReindex = () => {
    setIsReindexing(true);
    setTimeout(() => setIsReindexing(false), 1200);
  };

  const handleAddDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title || !addForm.content) return;
    const newDoc: KnowledgeDocItem = {
      id: `doc-${Date.now()}`,
      title: addForm.title,
      source: addForm.source || `docs/${addForm.title.toLowerCase().replace(/\s+/g, '-')}.md`,
      sourceType: addForm.sourceType,
      chunksCount: Math.max(1, Math.ceil(addForm.content.length / 400)),
      tokensCount: Math.max(100, Math.ceil(addForm.content.length / 3.5)),
      updatedAt: 'Just now',
      status: 'indexed',
      content: addForm.content,
    };
    setDocs([newDoc, ...docs]);
    setIsAddModalOpen(false);
    setAddForm({ title: '', source: '', sourceType: 'project-docs', content: '' });

    // Persist to PostgreSQL backend
    try {
      await fetch('/api/backend/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDoc.title,
          source: newDoc.source,
          sourceType: newDoc.sourceType,
          content: newDoc.content,
        }),
      });
    } catch (err) {
      console.warn('Failed to persist ingested doc to backend:', err);
    }
  };

  const totalTokens = docs.reduce((acc, d) => acc + d.tokensCount, 0);
  const totalChunks = docs.reduce((acc, d) => acc + d.chunksCount, 0);

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
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{docs.length} Docs</div>
            <div style={{ fontSize: '11px', color: '#06b6d4', marginTop: '4px' }}>Project code, standards & specs</div>
          </div>

          <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vector Chunks</span>
              <Database size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{totalChunks} Chunks</div>
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
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Ingested Tokens</span>
              <Zap size={16} color="#eab308" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{totalTokens.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#eab308', marginTop: '4px' }}>Ready for LLM context injection</div>
          </div>
        </div>

        {/* Tab & Action Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`btn btn-sm ${activeTab === 'catalog' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <BookOpen size={14} />
              <span>Knowledge Documents ({docs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`btn btn-sm ${activeTab === 'search' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Search size={14} />
              <span>Semantic Retrieval Simulator</span>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={13} />
              <span>Ingest Document</span>
            </button>

            <button
              onClick={handleReindex}
              disabled={isReindexing}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={isReindexing ? 'animate-spin' : ''} />
              <span>{isReindexing ? 'Reindexing...' : 'Sync pgvector'}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Knowledge Document Catalog */}
        {activeTab === 'catalog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Search & Filter Bar */}
            <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ position: 'relative', minWidth: '320px', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search documents, block source paths, guidelines..."
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Filter:</span>
                {['all', 'project-code', 'project-docs', 'standards', 'eds-docs', 'aem-docs'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setCatalogFilterType(st)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: catalogFilterType === st ? 'var(--color-info-dim)' : 'transparent',
                      color: catalogFilterType === st ? 'var(--color-info)' : 'var(--text-secondary)',
                      border: catalogFilterType === st ? '1px solid var(--color-info)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    {st === 'all' ? 'All Types' : SOURCE_WEIGHTS[st]?.label || st}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Table */}
            <div className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Ingested Knowledge Documents</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Click any document or click &quot;View Document&quot; to inspect full specifications, code snippets, and vector chunk mappings.
                  </p>
                </div>
                <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={12} />
                  <span>{filteredDocs.length} Active Documents</span>
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
                      <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc) => {
                      const badgeColor = SOURCE_WEIGHTS[doc.sourceType]?.color || '#3b82f6';
                      return (
                        <tr
                          key={doc.id}
                          onClick={() => setSelectedDocForModal(doc)}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            transition: 'background 0.1s ease',
                          }}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: `${badgeColor}18`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <BookOpen size={14} color={badgeColor} />
                              </div>
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
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDocForModal(doc);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                              <Eye size={12} />
                              <span>View Doc</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Semantic Retrieval Simulator */}
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

      {/* Document Reader Modal */}
      {selectedDocForModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
          onClick={() => setSelectedDocForModal(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '860px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-sm)',
                    background: `${SOURCE_WEIGHTS[selectedDocForModal.sourceType]?.color || '#3b82f6'}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BookOpen size={18} color={SOURCE_WEIGHTS[selectedDocForModal.sourceType]?.color || '#3b82f6'} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedDocForModal.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    <span>{selectedDocForModal.source}</span>
                    <span>•</span>
                    <span>{selectedDocForModal.chunksCount} Chunks</span>
                    <span>•</span>
                    <span>{selectedDocForModal.tokensCount.toLocaleString()} Tokens</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleCopyDocContent}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedDoc ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
                  <span>{copiedDoc ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedDocForModal(null)}
                  style={{ padding: '6px' }}
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body: Document Viewer */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '20px 24px',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  lineHeight: 1.7,
                  overflowX: 'auto',
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text-primary)',
                  }}
                >
                  {selectedDocForModal.content}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--text-tertiary)',
              }}
            >
              <span>Vector Weight: <strong>{SOURCE_WEIGHTS[selectedDocForModal.sourceType]?.weight || 1.0}x</strong></span>
              <button
                onClick={() => setSelectedDocForModal(null)}
                className="btn btn-primary btn-sm"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingest Document Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Upload size={16} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Ingest New Knowledge Document
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsAddModalOpen(false)} style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddDocSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  placeholder="e.g. Accordion Block Architecture & Guidelines"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Source Path
                  </label>
                  <input
                    type="text"
                    value={addForm.source}
                    onChange={(e) => setAddForm({ ...addForm, source: e.target.value })}
                    placeholder="docs/accordion.md or blocks/accordion/accordion.js"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Source Type
                  </label>
                  <select
                    value={addForm.sourceType}
                    onChange={(e) => setAddForm({ ...addForm, sourceType: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="project-code">Project Code</option>
                    <option value="project-docs">Project Docs</option>
                    <option value="standards">Standards</option>
                    <option value="eds-docs">EDS Docs</option>
                    <option value="aem-docs">AEM Docs</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Markdown / Code Content *
                </label>
                <textarea
                  required
                  rows={8}
                  value={addForm.content}
                  onChange={(e) => setAddForm({ ...addForm, content: e.target.value })}
                  placeholder="# Document Specification&#10;&#10;Provide guidelines, markdown notes, or code implementations to embed in pgvector..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-ghost btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={13} />
                  <span>Ingest & Embed</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

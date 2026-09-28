// ============================================================
// @aeds/agent-skills — Built-in Agent Skills
// Core typed skill definitions for the AI EDS Developer platform
// ============================================================

import type { AgentSkill } from '../types.js';

export const EDS_CREATE_BLOCK_SKILL: AgentSkill = {
  id: 'eds-create-block',
  version: '1.0.0',
  category: 'development',
  phases: ['code_generation', 'testing'],
  purpose: 'Create or reuse an EDS block with authoring, CSS/JS, and validation.',
  whenToUse: [
    'Architecture IR requires a new block',
    'Existing block cannot satisfy the requirement via options',
  ],
  inputs: ['EDSComponentIR', 'EDSProjectProfile', 'repository tree'],
  preconditions: [
    'Repository analyzed',
    'Existing blocks searched',
    'Reuse vs new decision recorded',
  ],
  procedure: [
    'Inspect repository',
    'Search existing blocks and utilities',
    'Decide reuse / block option / new block',
    'Design semantic HTML',
    'Implement CSS (localized)',
    'Add JS only if necessary',
    'Configure UE model/definition/filter',
    'Lint, build, preview',
    'Run browser, a11y, visual checks',
    'Diagnose/fix/regress on failures',
  ],
  constraints: [
    'Prefer existing blocks',
    'No secrets in client code',
    'Never skip validation because code looks correct',
    'Smallest safe change when fixing',
  ],
  examples: ['Create hero from Design IR using project hero conventions'],
  antiPatterns: [
    'Figma -> JavaScript without IR',
    'Duplicate CSS across blocks',
    'Claim PASS without evidence',
  ],
  validation: [
    'decorate() export present',
    'Build/lint evidence recorded',
    'UE schemas valid JSON',
  ],
  failureConditions: [
    'No decorate export',
    'Build failed',
    'Quality gate failed without diagnosis',
  ],
};

export const EDS_ARCHITECTURE_SKILL: AgentSkill = {
  id: 'eds-architecture',
  version: '1.0.0',
  category: 'architecture',
  phases: ['planning'],
  purpose: 'Produce validated EDSArchitectureIR before coding.',
  whenToUse: ['After project analysis', 'Before EDS Developer agent'],
  inputs: ['Design IR or NL requirements', 'project profile'],
  preconditions: ['Project analyzer completed'],
  procedure: [
    'Map requirements to sections/blocks',
    'Prefer reuse and block options',
    'Emit EDSComponentIR per component',
    'Validate with Zod schemas',
  ],
  constraints: [
    'Project convention > generic LLM knowledge',
    'Official Adobe docs preferred for changing APIs',
  ],
  examples: ['Hero + cards page architecture'],
  antiPatterns: ['Generating code before IR'],
  validation: ['EDSArchitectureIRSchema.parse succeeds'],
  failureConditions: ['Invalid IR', 'No reuse decisions'],
};

export const EDS_UNIVERSAL_EDITOR_SKILL: AgentSkill = {
  id: 'eds-universal-editor',
  version: '1.0.0',
  category: 'authoring',
  phases: ['authoring', 'testing'],
  purpose: 'Configure and validate Universal Editor authoring contracts.',
  whenToUse: ['After block implementation', 'When UE authoring required'],
  inputs: ['EDSComponentIR', 'generated block files'],
  preconditions: ['Block markup and models planned'],
  procedure: [
    'Generate component definition/models/filters',
    'Instrument data-aue-* where required',
    'Validate JSON schemas',
    'Author/save/reopen when live UE available',
  ],
  constraints: [
    'Never put AEM credentials in frontend',
    'Distinguish AEM API auth from UE browser auth',
  ],
  examples: ['UE model for hero title/image fields'],
  antiPatterns: ['Fake UE PASS without open/edit/save evidence'],
  validation: ['Valid component-*.json / blocks/*/_*.json', 'Optional live authoring evidence'],
  failureConditions: ['Invalid models', 'Content not persisted'],
};

export const EDS_BLOCK_SCAFFOLDER_SKILL: AgentSkill = {
  id: 'block-scaffolder',
  version: '1.0.0',
  category: 'development',
  phases: ['code_generation'],
  purpose: 'Generate production-ready AEM EDS blocks with Universal Editor contracts and scoped CSS/JS.',
  whenToUse: [
    'Creating a new custom block for an EDS project',
    'Prototyping a block concept before full implementation',
    'Generating block variants from design specs',
  ],
  inputs: ['Block name', 'Authoring requirements', 'Visual specs'],
  preconditions: ['Block does not already exist in blocks/ directory', 'Project conventions understood'],
  procedure: [
    'Determine canonical block name in kebab-case',
    'Determine authoring table shape (1st row block name/variant, rows = items, columns = fields)',
    'Create blocks/<name>/<name>.js exporting default function decorate(block)',
    'Instrument DOM with data-aue-type="component" and data-aue-model="<name>"',
    'Create blocks/<name>/<name>.css strictly scoped to .<name> (mobile-first)',
    'Create Universal Editor model fragment blocks/<name>/_<name>.json',
    'Run npm run build:json to compile root component-models.json',
    'Generate sample authoring table markdown/HTML',
    'Verify real browser execution waiting for [data-block-status="loaded"]',
  ],
  constraints: [
    'Export default function decorate(block) only',
    'No external frameworks (React/Vue/jQuery) — pure modern DOM API',
    'All styles scoped to .<block-name>',
    'Keep JavaScript minimal (< 40 lines) and CSS minimal (< 60 lines)',
    'Universal Editor contract must accompany every custom block',
    'Support block variants via CSS classes (e.g. block.classList.contains(...))',
  ],
  examples: ['Scaffold cards block with (compact, horizontal) variants and UE model'],
  antiPatterns: [
    'Injecting inline style tags into document head',
    'Polluting global selectors (*, div, p) without block class prefix',
    'Writing complex JS for simple layout that pure CSS Flex/Grid handles',
    'Failing to generate Universal Editor models for authored blocks',
  ],
  validation: [
    'File blocks/<name>/<name>.js exists and exports decorate',
    'File blocks/<name>/<name>.css exists with .<name> root selector',
    'File blocks/<name>/_<name>.json exists with valid XWalk schema',
    'Zero syntax errors under project ESLint/Stylelint',
    'Browser execution confirms [data-block-status="loaded"] with 0 console errors',
  ],
  failureConditions: [
    'Missing decorate function export',
    'Unscoped CSS breaking page styles',
    'Invalid Universal Editor model fragment',
    'Console errors during block decoration',
  ],
};

export const EDS_BLOCK_TESTING_SKILL: AgentSkill = {
  id: 'block-testing',
  version: '1.0.0',
  category: 'development',
  phases: ['testing', 'qa'],
  purpose: 'Generate test suites for EDS blocks covering variants, responsiveness, and accessibility.',
  whenToUse: [
    'Validating block functional behavior after code generation',
    'Regression testing after block refactoring',
    'Quality gate automated verification',
  ],
  inputs: ['Block JS/CSS files', 'Mock table HTML'],
  preconditions: ['Block files exist and build without syntax errors'],
  procedure: [
    'Create simulated table DOM matching authoring structure',
    'Invoke decorate(block) on mock DOM element',
    'Assert expected transformed DOM structure (cards, images, links)',
    'Test variant classes (e.g. cards.highlight)',
    'Verify keyboard event listeners (Enter, Space, Arrow keys)',
    'Check ARIA role and attribute mutations',
  ],
  constraints: [
    'Do not rely on live network requests in unit tests',
    'Clean up DOM fixtures between test runs',
  ],
  examples: ['Test accordion toggle expansion and aria-expanded toggle'],
  antiPatterns: ['Testing only happy path and ignoring empty/variant rows'],
  validation: ['All unit and DOM assertions PASS in test runner'],
  failureConditions: ['Block decorate throws on malformed table input', 'Assertion failure'],
};

export const EDS_BLOCK_ACCESSIBILITY_SKILL: AgentSkill = {
  id: 'block-accessibility',
  version: '1.0.0',
  category: 'development',
  phases: ['testing', 'qa', 'fix'],
  purpose: 'Audit EDS blocks for keyboard navigation, ARIA roles, screen reader support, and focus management.',
  whenToUse: [
    'Reviewing interactive blocks (tabs, accordions, modals, carousels, mega menus)',
    'Fixing accessibility violations flagged by automated scans',
  ],
  inputs: ['Rendered block DOM', 'Block JS/CSS'],
  preconditions: ['Block renders in browser or JSDOM'],
  procedure: [
    'Check keyboard focusability: all interactive elements reachable via Tab',
    'Check keyboard operation: Enter/Space triggers buttons, Arrow keys navigate tablists',
    'Audit ARIA semantics: role, aria-expanded, aria-controls, aria-selected',
    'Inspect visible focus rings: never use outline: none without alternative focus state',
    'Verify color contrast ratio >= 4.5:1 for normal text and >= 3:1 for large text',
    'Ensure image elements have meaningful alt text or alt="" if decorative',
  ],
  constraints: [
    'Prefer semantic HTML elements (<button>, <a>, <details>) over ARIA retrofits',
    'Focus states must be visible in both light and dark modes',
  ],
  examples: ['Accessible tabs with role="tablist", role="tab", aria-selected'],
  antiPatterns: [
    '<div onclick="..."> without tabindex or role="button"',
    'outline: 0 without custom focus indicator',
    'Misusing aria-hidden on active interactive elements',
  ],
  validation: ['axe-core scan returns 0 violations on block markup', 'Keyboard navigation works in browser'],
  failureConditions: ['Trapped focus', 'Inaccessible interactive controls'],
};

export const EDS_CWV_OPTIMIZER_SKILL: AgentSkill = {
  id: 'cwv-optimizer',
  version: '1.0.0',
  category: 'quality',
  phases: ['qa', 'fix', 'code_generation'],
  purpose: 'Diagnose and fix Core Web Vitals issues (LCP, CLS, INP) specific to the EDS eager/lazy/delayed lifecycle.',
  whenToUse: [
    'LCP > 2.5s, CLS > 0.1, or INP > 200ms on preview or live EDS pages',
    'Optimizing hero block or above-the-fold content',
  ],
  inputs: ['Lighthouse / PageSpeed report', 'scripts.js', 'styles.css', 'Hero block code'],
  preconditions: ['Page preview deployed and measurable'],
  procedure: [
    'Analyze LCP element: if image in first block, load eager with fetchpriority="high"',
    'Eliminate render-blocking resources in <head> and eager phase',
    'Prevent CLS: enforce aspect-ratio and explicit dimensions on images and dynamic blocks',
    'Optimize INP: move analytics, tag managers, third-party widgets to delayed phase (3s timer)',
    'Ensure critical CSS is inlined or loaded in eager phase',
    'Verify web font loading uses font-display: swap and preloads font files',
  ],
  constraints: [
    'Eager phase must only load essential above-the-fold assets',
    'Keep initial payload under EDS 100KB budget',
    'Do not load third-party scripts before LCP',
  ],
  examples: ['Optimize hero block image: eager loading, fetchpriority="high", srcset'],
  antiPatterns: [
    'Using loading="lazy" on the LCP hero image',
    'Loading large JS libraries in eager phase',
    'Unsized responsive banner causing layout shift',
  ],
  validation: ['LCP < 2.5s', 'CLS < 0.1', 'INP < 200ms', 'Lighthouse Performance score >= 90'],
  failureConditions: ['Performance regression', 'Render blocking scripts introduced'],
};

export const EDS_ACCESSIBILITY_FIX_SKILL: AgentSkill = {
  id: 'accessibility-fix',
  version: '1.0.0',
  category: 'quality',
  phases: ['qa', 'fix', 'testing'],
  purpose: 'Scan EDS pages for WCAG 2.1 AA violations and generate specific document-level and code-level fixes.',
  whenToUse: [
    'Pre-launch accessibility compliance audit',
    'Remediating automated axe/Lighthouse accessibility defects',
    'European Accessibility Act (EAA) compliance checks',
  ],
  inputs: ['Page URL or HTML', 'axe audit results'],
  preconditions: ['Page accessible via HTTP or preview'],
  procedure: [
    'Run automated WCAG 2.1 AA scan',
    'Separate issues into Document-level fixes (authoring) vs Code-level fixes (developer)',
    'Document fixes: missing image alt text, broken heading hierarchy (H1 -> H3), non-descriptive links',
    'Code fixes: color contrast in styles.css, missing form labels, ARIA role corrections in blocks',
    'Apply code fixes to CSS/JS files',
    'Generate authoring fix instructions for content authors in Google Docs/Word/da.live',
    'Re-scan page to verify 0 remaining violations',
  ],
  constraints: [
    'WCAG 2.1 AA standard compliance',
    'Separate author responsibility from developer responsibility clearly',
  ],
  examples: ['Fix color contrast in button classes from 3.2:1 to 4.8:1'],
  antiPatterns: [
    'Patching HTML directly when fix belongs in source document table',
    'Suppressing lint/axe warnings without fixing underlying issue',
  ],
  validation: ['Axe core returns 0 critical/serious WCAG 2.1 AA violations'],
  failureConditions: ['Violations remain unresolved', 'Visual breakage introduced by contrast fix'],
};

export const EDS_PERFORMANCE_BUDGET_SKILL: AgentSkill = {
  id: 'performance-budget',
  version: '1.0.0',
  category: 'quality',
  phases: ['testing', 'qa'],
  purpose: 'Audit EDS page against the 100KB LCP budget and inventory critical path resources.',
  whenToUse: [
    'Evaluating page weight before publishing',
    'Reviewing third-party tag impact',
    'Continuous integration performance gate',
  ],
  inputs: ['Page waterfall', 'Network logs', 'Asset size inventory'],
  preconditions: ['Page rendered with network telemetry enabled'],
  procedure: [
    'Measure total bytes transferred before LCP event',
    'Calculate breakdown: HTML, CSS, critical JS, web fonts, LCP image',
    'Verify total critical payload <= 100KB gzipped',
    'Flag any asset loaded in Eager phase that can be deferred to Lazy or Delayed',
    'Enforce font subsetting (woff2 only, necessary character ranges)',
  ],
  constraints: ['EDS 100KB critical path budget strictly enforced'],
  examples: ['Audit script weights across Eager, Lazy, Delayed execution phases'],
  antiPatterns: ['Importing monolithic utility libraries in eager scripts.js'],
  validation: ['Total critical-path weight <= 100KB', 'No delayed scripts executed before LCP'],
  failureConditions: ['Budget exceeded (> 100KB)', 'Critical path blocked by non-essential scripts'],
};

export const EDS_PUBLISH_READINESS_SKILL: AgentSkill = {
  id: 'publish-readiness',
  version: '1.0.0',
  category: 'quality',
  phases: ['qa', 'deployment'],
  purpose: 'Pre-publish gate combining content quality, accessibility, links, and performance into a go/no-go score.',
  whenToUse: [
    'Before publishing preview pages to live production',
    'Automated quality gate verification in deployment agent',
  ],
  inputs: ['Preview page URL', 'Quality gate criteria'],
  preconditions: ['Build succeeded', 'Preview page deployed on *.aem.page'],
  procedure: [
    'Verify page loads with HTTP 200 without console errors',
    'Verify metadata: title, description, og:image, canonical, language tags',
    'Run accessibility check: 0 critical/serious WCAG violations',
    'Run performance check: Lighthouse score >= 90, CWV within thresholds',
    'Scan internal links: 0 broken links (404/500)',
    'Verify Universal Editor instruments if authoring enabled',
    'Produce composite readiness score and Go / No-Go recommendation',
  ],
  constraints: [
    'Never publish if critical quality checks fail',
    'Require human approval when automated confidence < 90%',
  ],
  examples: ['Pre-publish evaluation of /blog/new-product-launch'],
  antiPatterns: ['Declaring publish readiness based solely on build success'],
  validation: ['All checks PASS or explicitly waived with documented justification'],
  failureConditions: ['HTTP error', 'Broken critical links', 'WCAG AA blocker'],
};

export const EDS_SITE_HEALTH_REPORT_SKILL: AgentSkill = {
  id: 'site-health-report',
  version: '1.0.0',
  category: 'quality',
  phases: ['qa', 'analysis'],
  purpose: 'Generate comprehensive client-ready site health reports with scores, benchmarks, and recommendations.',
  whenToUse: [
    'Periodic site health monitoring',
    'Executive stakeholder presentations',
    'Comparing pre-migration vs post-migration results',
  ],
  inputs: ['Target site domain', 'Page list', 'Audit results'],
  preconditions: ['Site published and reachable'],
  procedure: [
    'Audit sample across homepage, category pages, product/article detail pages',
    'Score 4 core dimensions: Performance (CWV), Accessibility (WCAG), SEO, EDS Architecture',
    'Identify top 3 high-impact bottlenecks',
    'Generate prioritized remediation roadmap with effort/impact estimates',
    'Compile structured report with trend indicators and executive summary',
  ],
  constraints: ['Evidence-backed scoring only: include metric values, percentiles, test URLs'],
  examples: ['Site health audit of main--mybrand--org.aem.live'],
  antiPatterns: ['Subjective ratings without measured data backing'],
  validation: ['Report contains scores, raw metrics, and concrete action items'],
  failureConditions: ['Target site unreachable', 'Incomplete audit data'],
};

export const EDS_PROJECT_HEALTH_SKILL: AgentSkill = {
  id: 'eds-project-health',
  version: '1.0.0',
  category: 'operations',
  phases: ['analysis', 'build'],
  purpose: 'Audit EDS repository structure, scripts.js, helix-query.yaml, dependencies, lint configs, and block architecture.',
  whenToUse: [
    'Onboarding to an existing EDS project',
    'Before starting a major block development sprint',
    'Project Analyzer phase in AI EDS Developer pipeline',
  ],
  inputs: ['Repository file tree', 'package.json', 'fstab.yaml', 'scripts/scripts.js'],
  preconditions: ['Repository cloned and accessible'],
  procedure: [
    'Verify EDS folder conventions: /blocks/, /scripts/, /styles/, /icons/',
    'Inspect scripts/scripts.js: check loadEager, loadLazy, loadDelayed sequence',
    'Inspect styles/styles.css: check CSS custom property tokens, font declarations, reset',
    'Check helix-query.yaml: verify indexing keys, sheet targets, and query performance',
    'Check ESLint and Stylelint configs',
    'Catalog all existing blocks and variants for reuse analysis',
  ],
  constraints: ['Do not modify repository files during health check'],
  examples: ['Audit existing repo to detect available blocks for reuse before creating new ones'],
  antiPatterns: ['Assuming boilerplate defaults without inspecting actual project code'],
  validation: ['Generates complete EDSProjectProfile and block inventory'],
  failureConditions: ['Invalid EDS folder layout', 'Malformed scripts.js'],
};

export const EDS_AEM_TO_EDS_MIGRATION_SKILL: AgentSkill = {
  id: 'aem-to-eds-migration',
  version: '1.0.0',
  category: 'architecture',
  phases: ['analysis', 'planning'],
  purpose: 'Plan and execute migration from traditional AEM Sites (HTL, dialogs, clientlibs) to Edge Delivery Services.',
  whenToUse: [
    'Migrating classic AEM Sites pages/components to EDS blocks and documents',
    'Architecture phase when input is an existing AEM page or component export',
  ],
  inputs: ['AEM component export / JCR structure', 'Content hierarchy', 'Clientlibs'],
  preconditions: ['AEM source content inspected or MCP connected'],
  procedure: [
    'Deconstruct AEM page into Sections (separated by ---) and Blocks',
    'Map complex HTL components into lightweight EDS blocks',
    'Convert AEM dialog schema into EDS table authoring model and UE component-models.json',
    'Extract design tokens from clientlib CSS into EDS styles.css custom properties',
    'Map Experience Fragments and Content Fragments to modular blocks or spreadsheets',
    'Define URL redirect strategy preserving existing SEO ranking',
  ],
  constraints: [
    'Do not carry over legacy AEM DOM wrappers (cq:panel, responsivegrid divs)',
    'Eliminate monolithic clientlibs in favor of block-scoped CSS/JS',
  ],
  examples: ['Migrate AEM WKND Teaser component to EDS Hero block'],
  antiPatterns: [
    'Replicating nested AEM div soup in EDS block decoration',
    'Attempting to run HTL or OSGi services in EDS frontend',
  ],
  validation: ['EDS component IR covers 100% of required AEM authored fields'],
  failureConditions: ['Incompatible AEM backend logic requiring headless API that is missing'],
};

export const EDS_QUERY_INDEX_OPTIMIZER_SKILL: AgentSkill = {
  id: 'query-index-optimizer',
  version: '1.0.0',
  category: 'architecture',
  phases: ['planning', 'code_generation'],
  purpose: 'Audit and optimize helix-query.yaml configuration, indexed properties, and sheet performance.',
  whenToUse: [
    'Configuring site search, blog indexes, product catalogs, or card grids',
    'Optimizing slow query-index.json fetch sizes',
  ],
  inputs: ['helix-query.yaml', 'Target sheet schemas', 'Search requirements'],
  preconditions: ['helix-query.yaml present or needed in project'],
  procedure: [
    'Analyze query patterns: filter properties, sort keys, target paths',
    'Configure indices in helix-query.yaml with minimal required target properties',
    'Exclude unnecessary large body text fields to keep query-index.json lightweight',
    'Configure cache headers and path inclusions/exclusions',
    'Validate YAML schema against Helix query specifications',
  ],
  constraints: [
    'Keep index records lean to prevent large network downloads on mobile',
    'Only index fields required for card display or client-side filtering',
  ],
  examples: ['Configure blog query index with path, title, date, image, description, tags'],
  antiPatterns: [
    'Indexing full article HTML bodies in query-index.json',
    'Missing path filtering resulting in administrative or draft files indexed',
  ],
  validation: ['helix-query.yaml passes schema validation', 'Index payload size is optimized'],
  failureConditions: ['Invalid YAML syntax', 'Circular or malformed indexing patterns'],
};

export const EDS_BULK_METADATA_SKILL: AgentSkill = {
  id: 'bulk-metadata',
  version: '1.0.0',
  category: 'authoring',
  phases: ['planning', 'authoring'],
  purpose: 'Audit and update metadata across multiple pages via metadata spreadsheets and helix-query configurations.',
  whenToUse: [
    'Managing site-wide metadata (OpenGraph, Twitter cards, robots, themes, templates)',
    'Applying taxonomy, canonical rules, or nav configurations across directories',
  ],
  inputs: ['metadata.xlsx / metadata.json', 'Site directory structure'],
  preconditions: ['EDS metadata sheet configured in fstab/helix'],
  procedure: [
    'Inspect URL pattern matching rules in metadata spreadsheet (exact vs glob patterns)',
    'Define default fallback rows and path-specific overrides',
    'Ensure standard metadata properties: title, description, og:image, og:type, robots, theme',
    'Verify inheritance rules (e.g. /products/* inherits commerce theme)',
    'Validate that all target URLs receive intended metadata tags',
  ],
  constraints: ['Specific path patterns must precede broader wildcard patterns in evaluation order'],
  examples: ['Configure default og:image and theme: dark for /news/* section'],
  antiPatterns: ['Hardcoding meta tags directly into head.html instead of metadata sheets'],
  validation: ['All audited URLs render expected <meta> tags in DOM'],
  failureConditions: ['Broken regex patterns in URL column', 'Conflicting override rows'],
};

export const EDS_CONTENT_DIFF_SKILL: AgentSkill = {
  id: 'content-diff',
  version: '1.0.0',
  category: 'authoring',
  phases: ['testing', 'qa'],
  purpose: 'Compare content and rendered DOM between preview and live environments or draft and published states.',
  whenToUse: [
    'Visual regression testing before deploying changes to live',
    'Verifying author edits in Google Docs/Word propagate accurately to preview',
  ],
  inputs: ['Preview URL', 'Live URL or reference HTML'],
  preconditions: ['Both URLs accessible'],
  procedure: [
    'Fetch HTML from both endpoints',
    'Normalize DOM (strip dynamic IDs, timestamps, session tokens)',
    'Generate semantic structural diff (sections, blocks, headings, images, links)',
    'Capture visual screenshots at mobile and desktop viewports',
    'Calculate pixel diff percentage and structural change score',
    'Flag unexpected deletions, layout shifts, or style regressions',
  ],
  constraints: ['Highlight intentional content edits vs unintended technical regressions'],
  examples: ['Compare preview vs live to verify hero text update did not break button styling'],
  antiPatterns: ['Comparing raw unnormalized HTML containing dynamic CDN cache headers'],
  validation: ['Diff accurately isolates content changes from technical regressions'],
  failureConditions: ['Endpoint 404/500', 'Complete layout breakage'],
};

export const EDS_STRUCTURED_DATA_SKILL: AgentSkill = {
  id: 'structured-data',
  version: '1.0.0',
  category: 'seo',
  phases: ['code_generation', 'authoring'],
  purpose: 'Generate JSON-LD structured data schema (Article, FAQ, Product, Organization, Breadcrumb) for EDS pages.',
  whenToUse: [
    'Enhancing Google search rich results and AI snippet visibility',
    'Adding schema to articles, products, FAQs, organization pages',
  ],
  inputs: ['Page content', 'Schema type requirement', 'Metadata'],
  preconditions: ['Page content and authoring fields defined'],
  procedure: [
    'Determine appropriate Schema.org type (Article, Product, FAQPage, BreadcrumbList, Organization)',
    'Extract required properties from page metadata and block content',
    'Generate valid JSON-LD script element: <script type="application/ld+json">',
    'Validate against Google Rich Results test specifications',
    'Integrate into block decorate() or scripts.js buildDelayed/buildLazy phase',
  ],
  constraints: [
    'JSON-LD must accurately represent visible page content (Google policy)',
    'Escape special characters to prevent XSS injection',
  ],
  examples: ['Generate FAQPage JSON-LD schema from accordion block items'],
  antiPatterns: [
    'Fabricating ratings, prices, or author data not present on page',
    'Inserting broken JSON syntax causing parser crashes',
  ],
  validation: ['Schema passes Google Rich Results test validation without errors'],
  failureConditions: ['Invalid JSON syntax', 'Missing required Schema.org fields'],
};

export const EDS_GEO_REWRITE_SKILL: AgentSkill = {
  id: 'geo-rewrite',
  version: '1.0.0',
  category: 'seo',
  phases: ['planning', 'authoring'],
  purpose: 'Rewrite EDS page content for AI search discoverability (GEO), boosting factual density and citation rate.',
  whenToUse: [
    'Optimizing content for Perplexity, ChatGPT Search, Gemini, and Google AI Overviews',
    'Modernizing thin or fluff-heavy marketing copy into high-citation authority content',
  ],
  inputs: ['Current page copy', 'Target topic entities', 'Audience intent'],
  preconditions: ['Subject matter accuracy verified with domain expert'],
  procedure: [
    'Audit text for factual density (claims backed by specific numbers, dates, definitions)',
    'Structure with clear, question-answering H2/H3 headings matching natural language queries',
    'Place direct, definitive answers in the first 50 words under each heading',
    'Convert unstructured paragraphs into semantic comparison tables, bullet lists, and step workflows',
    'Add authoritative citations and entity references',
    'Preserve brand tone while removing redundant marketing hyperbole',
  ],
  constraints: [
    'Factual accuracy is paramount: never hallucinate statistics or dates',
    'Keep reading level accessible while retaining technical precision',
  ],
  examples: ['Restructure product overview with quick-fact comparison table and direct FAQ answers'],
  antiPatterns: [
    'Keyword stuffing and repetitive phrasing',
    'Fluffy filler intros before answering user questions',
  ],
  validation: ['Factual density score increased', 'Content answers target queries in top paragraphs'],
  failureConditions: ['Inaccurate claims introduced', 'Brand voice violated'],
};

export const EDS_GO_LIVE_CHECKLIST_SKILL: AgentSkill = {
  id: 'go-live-checklist',
  version: '1.0.0',
  category: 'operations',
  phases: ['qa', 'deployment'],
  purpose: 'Full site launch readiness check: DNS, SSL, robots.txt, 404 handler, redirects, analytics, and performance.',
  whenToUse: [
    'Final verification 24-48 hours before domain cutover and public launch',
    'Deployment agent production sign-off gate',
  ],
  inputs: ['Production domain', 'Staging/preview audit results', 'Redirect map'],
  preconditions: ['Preview testing passed', 'DNS access available'],
  procedure: [
    'Check DNS records and CDN / Fastly / Cloudflare configurations',
    'Verify SSL/TLS certificate validity and HTTPS redirect enforcement',
    'Audit robots.txt (ensure staging disallow rules are removed for production)',
    'Audit sitemap.xml reachability and URL validity',
    'Test custom 404 page rendering and correct HTTP 404 status code',
    'Verify redirect map execution without chains or loops',
    'Verify analytics / Adobe Experience Platform tags in delayed execution phase',
    'Verify Core Web Vitals on production endpoints under synthetic load',
  ],
  constraints: [
    'Zero critical launch blockers allowed',
    'Rollback procedure and DNS TTL reduction must be prepared before launch',
  ],
  examples: ['Pre-launch checklist for https://www.brand.com cutover'],
  antiPatterns: [
    'Launching with robots.txt: Disallow: /',
    'Forgetting custom 404 page returning 200 OK',
  ],
  validation: ['All go-live checklist items verified with pass evidence'],
  failureConditions: ['SSL error', 'Unresolved critical redirect loop', 'CWV failure'],
};

export const BUILTIN_SKILLS: AgentSkill[] = [
  EDS_CREATE_BLOCK_SKILL,
  EDS_ARCHITECTURE_SKILL,
  EDS_UNIVERSAL_EDITOR_SKILL,
  EDS_BLOCK_SCAFFOLDER_SKILL,
  EDS_BLOCK_TESTING_SKILL,
  EDS_BLOCK_ACCESSIBILITY_SKILL,
  EDS_CWV_OPTIMIZER_SKILL,
  EDS_ACCESSIBILITY_FIX_SKILL,
  EDS_PERFORMANCE_BUDGET_SKILL,
  EDS_PUBLISH_READINESS_SKILL,
  EDS_SITE_HEALTH_REPORT_SKILL,
  EDS_PROJECT_HEALTH_SKILL,
  EDS_AEM_TO_EDS_MIGRATION_SKILL,
  EDS_QUERY_INDEX_OPTIMIZER_SKILL,
  EDS_BULK_METADATA_SKILL,
  EDS_CONTENT_DIFF_SKILL,
  EDS_STRUCTURED_DATA_SKILL,
  EDS_GEO_REWRITE_SKILL,
  EDS_GO_LIVE_CHECKLIST_SKILL,
];

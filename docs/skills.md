# Agent Skills

Package: `@aeds/agent-skills`.  
Customization Root: `.agents/skills/<skill-name>/SKILL.md`.

Skills in the **AI EDS Developer** platform are **versioned engineering procedures**, not loose prompts. Each skill codifies operational knowledge, strict constraints, step-by-step procedures, anti-patterns, validation checklists, and failure conditions.

---

## 1. Skill Integration Architecture

The platform integrates skills at two complementary layers:

1. **Workspace Agent Customizations (`.agents/skills/`)**:
   - 42 operational EDS skills integrated from the Focus-GTS EDS content operations library.
   - Discovered automatically by **Google Antigravity**, **Cursor**, **Claude Code**, and the AI IDE environment.
   - Each skill contains `SKILL.md` (YAML frontmatter + markdown procedure) and associated reference documents under `references/`.

2. **TypeScript Engine (`@aeds/agent-skills`)**:
   - High-fidelity built-in `AgentSkill` constants for runtime agent injection.
   - Markdown parser (`parseSkillMarkdown`) allowing dynamic loading of any `SKILL.md`.
   - Workspace directory loader (`findWorkspaceSkillsDir`, `loadSkillsFromDirectory`, `getAllSkills`).
   - Category (`SkillCategory`) and lifecycle phase (`SkillPhase`) query helpers.
   - Prompt generation API (`getSkillPromptSection`, `getSkillsPromptSection`).

```
┌────────────────────────────────────────────────────────┐
│               .agents/skills/ (42 Skills)              │
│       SKILL.md + references/ (WCAG, budgets, etc.)      │
└───────────────────────────┬────────────────────────────┘
                            │ Discovered & Parsed
                            ▼
┌────────────────────────────────────────────────────────┐
│                 @aeds/agent-skills                     │
│  - Built-in High-Performance AgentSkills (19 core)     │
│  - Markdown Dynamic Loader & Parser                    │
│  - Categorization, Phase Filtering, Keyword Search     │
│  - Prompt Section Generation                           │
└───────────────────────────┬────────────────────────────┘
                            │ Injected into RunContext
                            ▼
┌────────────────────────────────────────────────────────┐
│                   @aeds/agent Pipeline                 │
│  Architecture · Developer · QA · UE · Fix · Deployment │
└────────────────────────────────────────────────────────┘
```

---

## 2. API Usage

```ts
import {
  getSkill,
  getSkillPromptSection,
  getSkillsPromptSection,
  getAllSkills,
  getSkillsByCategory,
  getSkillsByPhase,
  searchSkills,
  EDS_SKILL_CATALOG,
  ALL_SKILLS,
} from '@aeds/agent-skills';

// Retrieve single skill
const scaffolder = getSkill('block-scaffolder');

// Render formatted prompt section for LLM injection
const promptSection = getSkillPromptSection('block-scaffolder');

// Render combined prompt for multiple skills
const combined = getSkillsPromptSection(['block-scaffolder', 'block-accessibility', 'cwv-optimizer']);

// Filter by lifecycle phase
const qaSkills = getSkillsByPhase('qa');

// Filter by category
const seoSkills = getSkillsByCategory('seo');

// Search skills by keyword
const vitalsSkills = searchSkills('Core Web Vitals');
```

---

## 3. Skills Taxonomy & Agent Mapping

The 42 skills are mapped across 10 functional categories aligned with the platform requirements:

| Skill ID | Category | Primary Lifecycle Phase | Primary Agent | Purpose |
|---|---|---|---|---|
| `block-scaffolder` | Development | `code_generation` | `EdsDeveloperAgent` | Generate production-ready EDS blocks (JS decorate, scoped CSS, sample doc table) |
| `block-testing` | Development | `testing`, `qa` | `QaAgent` | Generate test suites covering variants, responsiveness, and keyboard nav |
| `block-accessibility` | Development | `testing`, `fix` | `EdsDeveloperAgent` | Audit keyboard navigation, ARIA roles, focus management, screen readers |
| `block-migration` | Development | `planning`, `code_generation` | `ArchitectureAgent` | Port custom blocks between EDS projects with dependency resolution |
| `boilerplate-upgrade` | Development | `analysis`, `build` | `BuildAgent` | Apply upstream EDS boilerplate updates safely without breaking customizations |
| `eds-create-block` | Development | `code_generation` | `EdsDeveloperAgent` | End-to-end block development and validation lifecycle |
| `accessibility-fix` | Quality | `qa`, `fix` | `AccessibilityAgent` | Scan WCAG 2.1 AA violations and generate document vs code fixes |
| `cwv-optimizer` | Quality | `qa`, `fix` | `PerformanceAgent` | Optimize Core Web Vitals (LCP, CLS, INP) for EDS eager/lazy/delayed phases |
| `performance-budget` | Quality | `testing`, `qa` | `PerformanceAgent` | Enforce 100KB LCP budget and critical-path resource inventory |
| `publish-readiness` | Quality | `qa`, `deployment` | `QualityGateAgent` | Pre-publish gate combining content, a11y, links, and performance |
| `site-health-report` | Quality | `qa`, `analysis` | `QaAgent` | Multidimensional site health score across CWV, WCAG, SEO, and EDS architecture |
| `content-audit` | Quality | `qa`, `analysis` | `QaAgent` | Deep content quality audit (structure, metadata, readability, links) |
| `link-rot-scanner` | Quality | `qa`, `testing` | `QaAgent` | Crawl and detect 404 broken links across preview and live URLs |
| `eds-architecture` | Architecture | `planning` | `ArchitectureAgent` | Emit validated EDSArchitectureIR before coding |
| `aem-to-eds-migration` | Architecture | `analysis`, `planning` | `ArchitectureAgent` | Plan migration from classic AEM components/dialogs to EDS blocks |
| `query-index-optimizer` | Architecture | `planning` | `ArchitectureAgent` | Optimize helix-query.yaml indexing keys and sheet performance |
| `redirect-manager` | Architecture | `planning`, `qa` | `ArchitectureAgent` | Audit redirects spreadsheet for chains, loops, and broken targets |
| `redirect-migration` | Migration | `planning`, `deployment` | `ArchitectureAgent` | Legacy URL redirect mapping to preserve SEO equity |
| `content-migration` | Migration | `planning`, `authoring` | `UeAgent` | Bulk content migration into EDS document formats (da.live / Docs) |
| `eds-universal-editor` | Authoring | `authoring`, `testing` | `UeAgent` | Universal Editor models, definitions, filters, and live authoring checks |
| `bulk-metadata` | Authoring | `planning`, `authoring` | `UeAgent` | Manage metadata spreadsheets, OpenGraph tags, and directory inheritance |
| `author-onboarding` | Authoring | `analysis`, `authoring` | `UeAgent` | Document-based authoring coach: tables, section breaks, metadata blocks |
| `content-diff` | Authoring | `testing`, `qa` | `QaAgent` | Structural and visual diff between preview and live environments |
| `content-freshness` | Authoring | `analysis`, `qa` | `QaAgent` | Detect stale content, outdated dates, and orphaned index entries |
| `reading-level` | Authoring | `qa` | `QaAgent` | Flesch-Kincaid and ARI readability scoring |
| `brand-voice-check` | Authoring | `qa` | `QaAgent` | Verify content against brand editorial guidelines and tone rules |
| `geo-rewrite` | SEO | `planning`, `authoring` | `ArchitectureAgent` | Optimize content for AI search engines (Perplexity, ChatGPT, Gemini) |
| `structured-data` | SEO | `code_generation`, `authoring` | `EdsDeveloperAgent` | Generate JSON-LD schema (Article, FAQ, Product, Breadcrumb) |
| `heading-optimizer` | SEO | `qa`, `fix` | `QaAgent` | Audit heading hierarchy (H1-H6) for SEO intent and accessibility |
| `image-seo` | SEO | `code_generation`, `qa` | `EdsDeveloperAgent` | Image alt text, dimensions, and optimal eager/lazy loading attributes |
| `internal-linking` | SEO | `planning`, `analysis` | `ArchitectureAgent` | Internal linking graph optimization and orphan page resolution |
| `sitemap-audit` | SEO | `qa`, `testing` | `QaAgent` | Validate sitemap.xml against query index and live published URLs |
| `product-page-seo` | SEO | `planning`, `code_generation` | `EdsDeveloperAgent` | Commerce product page schema, OpenGraph tags, and canonicals |
| `catalog-audit` | Commerce | `analysis`, `qa` | `QaAgent` | Commerce catalog and category page completeness audit |
| `storefront-setup` | Commerce | `planning`, `code_generation` | `EdsDeveloperAgent` | Configure EDS Commerce drop-ins (cart, checkout, product details) |
| `eds-project-health` | Operations | `analysis`, `build` | `ProjectAnalyzerAgent` | Audit repo structure, scripts.js, helix-query.yaml, dependencies |
| `eds-skill-catalog` | Operations | `analysis`, `planning` | `ProjectAnalyzerAgent` | Match input requirements to the optimal EDS content-ops skill |
| `go-live-checklist` | Operations | `qa`, `deployment` | `DeploymentAgent` | Complete pre-launch checklist: DNS, SSL, robots.txt, 404, redirects |
| `eds-cicd-pipeline` | DevOps | `deployment`, `build` | `DeploymentAgent` | Set up GitHub Actions CI/CD with Lighthouse and preview commenting |
| `environment-management`| DevOps | `deployment` | `DeploymentAgent` | Multi-environment setup (dev, preview, live, production) |
| `localization-audit` | Operations | `analysis`, `qa` | `QaAgent` | Multi-language site parity and hreflang tag consistency audit |
| `optel-interpreter` | Analytics | `analysis`, `qa` | `QaAgent` | Interpret Operational Telemetry (OpTel) RUM performance data |
| `experiment-designer` | Analytics | `planning`, `code_generation` | `ArchitectureAgent` | Design A/B and multivariate experiments using EDS split sheets |
| `roi-narrative` | Analytics | `analysis` | `ProjectAnalyzerAgent` | Synthesize business ROI and performance improvements into narratives |
| `launch-retrospective` | Operations | `analysis` | `DeploymentAgent` | Post-launch retrospective report capturing milestones and metrics |

---

## 4. How Agents Utilize Skills

1. **Architecture Agent (`agent-architecture`)**:
   - Injects `eds-architecture` procedure to produce `EDSArchitectureIR`.
   - References `aem-to-eds-migration` when migrating legacy AEM components.
   - References `query-index-optimizer` when planning indexed collection blocks.

2. **EDS Developer Agent (`agent-eds-developer`)**:
   - Injects `block-scaffolder` and `block-accessibility` rules into block chunk synthesis (`generateOneBlockChunk`).
   - Ensures decorate() export, scoped CSS, mobile-first styling, and keyboard accessible controls.

3. **Validation & QA Agents (`agent-a11y`, `agent-perf`, `agent-qa`)**:
   - `AccessibilityAgent` applies `accessibility-fix` rules separating code vs document violations.
   - `PerformanceAgent` applies `cwv-optimizer` and `performance-budget` checks.
   - `QualityGateAgent` applies `publish-readiness` scoring.

4. **Universal Editor Agent (`agent-ue`)**:
   - Injects `eds-universal-editor` contracts and `bulk-metadata` spreadsheet structures.

---
name: eds-architecture
description: Plan EDS sections and blocks, and emit validated EDSArchitectureIR and EDSComponentIR before code generation, following evidence-over-assumptions principles.
license: Apache-2.0
metadata:
  version: "1.0.0"
---

# EDS Architecture Planning

Plan the architectural decomposition of an AEM Edge Delivery Services (EDS) page or site before any code is generated. Transforms Figma designs, scraped website pages, screenshot references, or AEM JCR/MCP exports into a strongly-typed `EDSArchitectureIR` and per-block `EDSComponentIR` validated against project Zod schemas.

## Requirements Reference (`docs/`)

- `docs/Product Vision.md` §1 & §4: "Evidence over assumptions. The AI does not stop when code is generated. It stops when the implementation has been tested and validated."
- `docs/architecture.md`: Context Engine (RAG + Skills + Project) & IR contracts.
- `docs/agent-system.md`: ArchitectureAgent executes in `PLANNING` phase and produces validated IR.
- `docs/phase-9-figma-design-ir.md`: Strict separation of Design IR → Architecture IR → EDS Component IR.

## When to Use

- In the `PLANNING` phase of the AI EDS Developer pipeline.
- After project analysis completes (`ProjectAnalyzerAgent`).
- When decomposing a new design, existing website page, or AEM page into EDS sections and blocks.
- When evaluating block reuse vs block options vs creating a new block.

## Do NOT Use

- Do NOT generate HTML, CSS, or JavaScript code directly without first generating and validating `EDSArchitectureIR`.
- Do NOT replicate legacy AEM div wrappers (`cq:panel`, `responsivegrid`).
- Do NOT create a brand-new block when an existing project block can satisfy requirements via block variants/options (e.g. `cards (highlight)`).
- Do NOT invent arbitrary block names that diverge from project conventions.

## Core Principles

1. **IR Before Code**: Every block implementation must be preceded by an `EDSComponentIR` specifying fields, authoring models, responsive behavior, semantic HTML, and testing criteria.
2. **Reuse Over Creation**: Project conventions > generic LLM patterns. Always check existing project blocks in `/blocks/` first.
3. **Sections as First-Class Layout**: Deconstruct pages into sections separated by metadata or thematic breaks (`---`), using default content containers where blocks are unnecessary.
4. **Universal Editor Preparedness**: Every authored block in the IR must plan its Universal Editor fields, models (`component-models.json`), and filter contracts.

## Step-by-Step Procedure

### Step 1: Ingest Inputs and Requirements
- Review `EDSProjectProfile` (existing blocks, style tokens, boilerplate version).
- Ingest design cues from `DesignIR`, reference screenshot, or AEM MCP component structure.

### Step 2: Section and Block Decomposition
- Segment the page into logical vertical sections.
- Identify standard default content (paragraphs, headings, unstyled lists, standalone images) that do NOT require custom blocks.
- Map distinct UI patterns to EDS blocks (Hero, Cards, Teaser, Columns, Accordion, Quote, Carousel).

### Step 3: Block Reuse & Variant Evaluation
- Query project repository for existing blocks:
  - If identical: **REUSE**.
  - If minor visual variation: **BLOCK OPTION / VARIANT** (e.g. `cards (compact)`).
  - If novel semantic structure: **NEW BLOCK**.

### Step 4: Emit EDSComponentIR
For each component, generate:
- `name`: kebab-case block identifier.
- `type`: `'block'` | `'default-content'` | `'section-metadata'`.
- `authoring`: editable flag, fields with types (`text`, `reference`, `select`), options.
- `rendering`: semantic HTML structure, responsive behaviors (mobile/desktop).
- `implementation`: file paths (`blocks/<name>/<name>.js`, `blocks/<name>/<name>.css`).
- `accessibility`: semantic section, headings, image alt, keyboard operability requirements.
- `testing`: functional assertions and visual threshold criteria.

### Step 5: Validate IR Schemas
- Validate the complete output with `parseEDSArchitectureIR()`.
- Ensure 100% of required fields match Zod schema definitions.

## Produce Validation Checklist

- [ ] Page partitioned into logical sections.
- [ ] Block reuse vs new block decisions explicitly justified.
- [ ] Each block has a corresponding `EDSComponentIR` with authoring and rendering specifications.
- [ ] Universal Editor authoring fields mapped for each editable block.
- [ ] `parseEDSArchitectureIR()` succeeds with zero validation errors.

---
name: eds-create-block
description: Create or update an AEM EDS block with authoring models, CSS/JS implementation, Universal Editor contracts, and validation loop.
license: Apache-2.0
metadata:
  version: "1.0.0"
---

# EDS Create Block

Create or update an AEM Edge Delivery Services (EDS) block with complete authoring contracts, vanilla JS `decorate()` function, mobile-first scoped CSS, Universal Editor XWalk models, and empirical validation loop.

## Requirements Reference (`docs/`)

- `docs/Product Vision.md` §1 & §4: "Evidence over assumptions. Build: PASS, Unit tests: PASS, Browser test: PASS, UE authoring: PASS, Visual similarity: 97.8%."
- `docs/agent-system.md`: `EdsDeveloperAgent` in `IMPLEMENTING` phase.
- `docs/universal-editor.md`: Root aggregates (`component-definition.json`, `component-models.json`, `component-filters.json`) + XWalk source (`blocks/<name>/_<name>.json`).
- `docs/testing.md`: Playwright headless verification, `data-block-status="loaded"`, 0 console errors.

## When to Use

- When `ArchitectureAgent` determines that a new block is required or an existing block requires variant support.
- During the `IMPLEMENTING` phase of the agent pipeline.
- When scaffolding or refining block JavaScript and CSS.

## Do NOT Use

- Do NOT skip the validation loop because code "looks correct" (anti-pattern).
- Do NOT use frontend frameworks (React, Vue, jQuery) — vanilla modern ES modules only.
- Do NOT pollute global styles — all CSS selectors must be scoped to `.<block-name>`.
- Do NOT hardcode credentials, API secrets, or environment-specific hostnames into block code.

## Core Principles

1. **Vanilla ES Modules**: Export a single `default function decorate(block)` that receives the transformed table container.
2. **Strict CSS Scoping**: Every selector in `blocks/<name>/<name>.css` must begin with `.<name>` or `.<name>-wrapper`.
3. **Universal Editor Synchronization**: Provide `blocks/<name>/_<name>.json` defining fields, models, and filter definitions so Universal Editor can immediately author the block.
4. **Data-AUE Instrumentation**: Instrument block DOM elements with `data-aue-*` attributes during `decorate()`:
   - `block.dataset.aueType = 'component'`
   - `block.dataset.aueModel = '<block-name>'`
   - `element.dataset.aueProp = '<field-name>'`
5. **Evidence Collection**: Record build, lint, and browser test results as structured `SystemEvidence`.

## Step-by-Step Procedure

### Step 1: Inspect Inputs & IR
- Read `EDSComponentIR` for the target block.
- Inspect project `styles/styles.css` for available design tokens and variables (`--link-color`, `--heading-font-family`, `--background-color`).

### Step 2: Implement JavaScript (`blocks/<name>/<name>.js`)
- Write `export default function decorate(block) { ... }`.
- Extract table rows and cells cleanly into semantic HTML (`<picture>`, `<h2>`, `<p>`, `<a>`).
- Format links inside text rows into EDS buttons (`a.classList.add('button', 'primary')`).
- Add Universal Editor dataset attributes (`data-aue-*`).
- Keep JS concise (< 40 lines where feasible).

### Step 3: Implement Scoped CSS (`blocks/<name>/<name>.css`)
- Mobile-first responsive layout (single column by default, Flex/Grid at desktop breakpoint `@media (width >= 900px)`).
- Scope all selectors to `.<block-name>`.
- Support block variants via modifier classes (e.g. `.<block-name>.highlight`).

### Step 4: Write Universal Editor Model (`blocks/<name>/_<name>.json`)
- Define definitions, models, and filters for Universal Editor XWalk compilation.
- Ensure field IDs match authored table column positions.

### Step 5: Validate
- Run ESLint and Stylelint.
- Verify block builds without errors.
- Run headless browser test waiting for `.<block-name>[data-block-status="loaded"]`.
- Check console logs for 0 uncaught exceptions.

## Produce Validation Checklist

- [ ] File `blocks/<name>/<name>.js` exists and exports `decorate(block)`.
- [ ] File `blocks/<name>/<name>.css` exists with all selectors scoped to `.<name>`.
- [ ] Universal Editor contract `blocks/<name>/_<name>.json` created.
- [ ] Mobile-first responsiveness verified at 375px and 1280px.
- [ ] ESLint / Stylelint pass with 0 errors.
- [ ] Real browser evidence collected showing `data-block-status="loaded"`.

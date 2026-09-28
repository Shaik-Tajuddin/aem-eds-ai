---
name: eds-universal-editor
description: Configure and validate Universal Editor authoring contracts, models, filters, data-aue-* instrumentation, and authoring persistence cycles.
license: Apache-2.0
metadata:
  version: "1.0.0"
---

# EDS Universal Editor Integration

Configure, instrument, and validate Universal Editor (UE) authoring contracts for AEM Edge Delivery Services blocks and pages. Ensures authors can visually select, edit, and persist content in Adobe Universal Editor with full schema compliance.

## Requirements Reference (`docs/`)

- `docs/universal-editor.md`: Root aggregates, XWalk sources, `@aeds/aem` classes, live authoring loops.
- `docs/phase-8-aem-universal-editor.md`: Full UE specifications, `component-definition.json`, `component-models.json`, `component-filters.json`.
- `docs/agent-system.md`: `UniversalEditorAgent` in `UE_AUTHORING` phase.
- `docs/Product Vision.md` §4: "UE authoring: PASS. Evidence over assumptions."

## When to Use

- During `UE_AUTHORING` phase after block code generation.
- When configuring visual authorability for new or modified EDS blocks.
- When verifying `data-aue-*` DOM attributes in preview environments.
- When executing live or simulated edit → save → reopen authoring persistence tests.

## Do NOT Use

- Do NOT put AEM credentials or IMS tokens in frontend client code.
- Do NOT fake UE PASS without DOM instrumentation or schema validation evidence.
- Do NOT confuse AEM API authentication with Universal Editor browser SSO session credentials.
- Do NOT manually edit aggregated `component-models.json` directly if the project compiles them from XWalk `blocks/*/_*.json` fragments via `build:json`.

## Core Principles

1. **XWalk Source Architecture**:
   - Write block fragments in `blocks/<id>/_<id>.json`.
   - Write section models in `models/_section.json`.
   - Compile into aggregates: `component-definition.json`, `component-models.json`, `component-filters.json`.
2. **DOM Instrumentation**:
   - Blocks: `data-aue-type="component"`, `data-aue-model="<block-id>"`
   - Text fields: `data-aue-type="text"`, `data-aue-prop="<property-id>"`
   - References / Media: `data-aue-type="reference"`, `data-aue-prop="<image-prop>"`
   - Containers: `data-aue-type="container"`, `data-aue-filter="<filter-id>"`
3. **Evidence-Backed Validation**:
   - Record PASS/FAIL/UNAVAILABLE status based on actual schema parsing and DOM query checks.

## Step-by-Step Procedure

### Step 1: Model and Definition Generation
- Generate `blocks/<name>/_<name>.json` defining:
  - `definitions`: Unique component ID, title, and category.
  - `models`: Fields array with `id`, `label`, `component` (`text`, `reference`, `select`, `multiline`), and validation rules.
  - `filters`: Allowed child components or container constraints.
- Run `npm run build:json` or invoke `@aeds/aem` `UniversalEditorModelGenerator`.

### Step 2: Decorate DOM with Instrumentation
- In `blocks/<name>/<name>.js`, add instrumentation logic during decoration:
  ```js
  block.dataset.aueType = 'component';
  block.dataset.aueModel = '<block-name>';
  ```
- Add `data-aue-prop` and `data-aue-type` to authored text and image elements.

### Step 3: Offline Schema Validation
- Validate generated JSON against Universal Editor JSON Schema specifications using `UniversalEditorValidator`.
- Ensure no missing mandatory field properties or unresolved model references.

### Step 4: Preview DOM Instrumentation Check
- In preview environment (`*.aem.page` or local dev server), inspect rendered DOM.
- Verify elements possess expected `data-aue-*` attributes without breaking visual layout.

### Step 5: Persistence Loop Verification
- If live Universal Editor session is configured (`ENABLE_LIVE_UE_AUTHORING=true`):
  - Execute Playwright edit → save → reopen cycle.
  - Re-read persisted page via AEM Cloud MCP/JCR to confirm change persistence.
- Record structured `SystemEvidence` for the authoring test.

## Produce Validation Checklist

- [ ] `blocks/<name>/_<name>.json` exists and is syntactically valid JSON.
- [ ] Root `component-models.json` includes the block model.
- [ ] `decorate(block)` instruments root with `data-aue-type="component"`.
- [ ] Text and media elements instrumented with `data-aue-prop`.
- [ ] Schema validation returns 0 errors.
- [ ] Authoring persistence evidence recorded without fabricated results.

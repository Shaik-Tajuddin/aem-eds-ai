# Phase 8 Implementation Plan — AEM Cloud & Universal Editor Adapter (`@aeds/aem`)

## Overview
This document specifies the technical architecture, contracts, and test plans for **Phase 8: AEM Cloud & Universal Editor Adapter (`@aeds/aem`)**.

---

## 🛠️ Architecture & Components

### 1. Types & Data Models (`src/types.ts`)
- **`AemClientConfig`**: AEM Author URL, Preview URL, environment type, and authentication credentials (bearer token or IMS config).
- **`ComponentDefinition`**: Conforms to Adobe Universal Editor schema:
  - `id`: unique component identifier (e.g. `product-hero`).
  - `title`: human-readable title.
  - `category`: group name (e.g. `Blocks`, `Commerce`).
  - `plugins`: authoring UI plugins.
- **`ComponentModel`**: Field definitions for authoring:
  - `fields`: array of `ComponentField` (`text`, `richtext`, `aem-content`, `image`, `select`, `boolean`, `multifield`).
- **`ComponentFilter`**: Container inclusion rules (`components: string[]`).
- **`AuthoringValidationReport`**:
  - `blocksTested`: count of verified blocks.
  - `fieldsTested`: count of verified editable fields.
  - `passed`: overall boolean flag.
  - `results`: detailed block-level breakdown.

### 2. Error Classes (`src/errors.ts`)
- `AemError` with typed `AemErrorCode`:
  - `AUTHENTICATION_REQUIRED`: Fails loudly when credentials are not configured (per §75).
  - `NETWORK_ERROR`: Remote connection failure.
  - `PREVIEW_FAILED`: Error dispatching preview update.
  - `PUBLISH_FAILED`: Error dispatching live publish.
  - `INVALID_COMPONENT_MODEL`: Schema validation error.
  - `INSTRUMENTATION_MISSING`: Block HTML lacks required `data-aue-*` attributes.
  - `AUTHORING_TEST_FAILED`: Authoring persistence or rendering verification failure.

### 3. AEM Cloud Client (`src/client.ts`)
- Connects to AEM Cloud environment:
  - `previewPage(path)`: Dispatches Helix/EDS preview request.
  - `publishPage(path)`: Replicates or publishes content to production.
  - `getContentFragment(path)`: Fetches structured Content Fragment data via Assets REST API.
  - `queryJcr(query)`: Executes JCR / SQL2 queries on author instance.
- Strictly adheres to product vision: fails loudly if credentials are unset or invalid.

### 4. Universal Editor Model Generator (`src/models.ts`)
- Builds the 3 official Universal Editor root aggregates from block manifests (via XWalk sources + `build:json`):
  - `component-definition.json`
  - `component-models.json`
  - `component-filters.json`
- Supports automatic field type inference (e.g. image URLs mapped to `reference` with `mimeType: ["image/*"]`, headings to `text`, body copy to `richtext`).

### 5. DOM Instrumentation Validator (`src/validator.ts`)
- Validates that generated EDS blocks have proper Adobe Universal Editor attributes:
  - `data-aue-resource`: JCR or content fragment item path.
  - `data-aue-type`: `component` (block container) or `text` / `reference` (field).
  - `data-aue-model`: ID matching `component-models.json`.
  - `data-aue-prop`: Property name matching field schema.
  - `data-aue-behavior`: `component` or `inline`.
  - `data-aue-filter`: Filter ID matching `component-filters.json`.

### 6. Authoring Tester (`src/tester.ts`)
- Autonomous verification of the authoring cycle:
  - Simulates adding a block to a container.
  - Updates field values.
  - Verifies persistence after save.
  - Asserts that updated values properly reflect in the rendered DOM output.

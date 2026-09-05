# Phase 7 — Visual Regression & Comparison

## Overview
Phase 7 implemented `@aeds/visual`, the visual comparison and regression analysis engine. It provides automated pixel-level differential validation between design references (Figma renders, baseline screenshots) and live EDS preview pages.

---

## 🛠️ Components Implemented

### 1. Visual Comparator (`src/comparator.ts`)
- **`VisualComparator.compare(image1Buffer, image2Buffer, options)`**:
  - Decodes input images via `pngjs`.
  - Normalizes dimensions (handles differing heights/widths by canvas extension).
  - Executes high-performance pixel-level diffing via `pixelmatch`.
  - Generates differential visual heatmap overlays (red highlight diff buffer).
  - Computes exact match score (0–100%) and differential pixel percentage.
  - Automatically clusters adjacent mismatch pixels into bounding boxes (`BoundingBox` with coordinates: `x, y, width, height`).
  - Classifies differences by severity (`low`, `medium`, `high`, `critical`) based on cluster area and color delta.

### 2. Difference Detection & Clustering
- Detects bounding box clusters to give AI agents spatial awareness:
  - *Where* on the page did layout shift occur?
  - *Which* EDS block container had spacing or styling mismatches?
- Exports structured `VisualDifference` objects ready for LLM consumption during automated bug-fix loops (`FixAgent`).

### 3. Error Handling (`src/errors.ts`)
- `VisualError` with specific error codes:
  - `IMAGE_DECODE_FAILED`: Corrupted or invalid PNG buffer.
  - `DIMENSION_MISMATCH`: When images cannot be normalized.
  - `COMPARISON_FAILED`: Internal diff engine failure.

---

## 🧪 Unit Tests (`packages/visual/test/comparator.test.ts`)
Passing tests validating:
1. **100% Match Verification**: Identical image buffers return score 100%, 0 diff pixels, and `passed: true`.
2. **Difference Detection & Diff Image**: Contrast comparison detects differences, marks `passed: false`, produces diff image buffer, and identifies bounding box clusters.
3. **Corrupted Image Handling**: Throws structured `VisualError` with `IMAGE_DECODE_FAILED` when given invalid buffers.

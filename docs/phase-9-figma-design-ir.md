# Phase 9 — Figma REST Client & Design IR Converter

## Overview
Phase 9 implemented `@aeds/figma`, the design ingestion engine for the AI EDS Developer platform. It integrates with Figma's official REST API v1, parses standard and modern Figma design URLs, and converts raw design node trees into the canonical **Design Intermediate Representation (Design IR)** contract specified in Product Vision §8.

---

## 🛠️ Components Implemented

### 1. Figma URL Parser (`src/parser.ts`)
- **`FigmaUrlParser.parse(url)`**:
  - Handles `/file/:fileKey/...` and `/design/:fileKey/...` URLs.
  - Extracts target frame node IDs from query strings (e.g. `?node-id=1-42` or `?node-id=1:42`).
  - Rejects malformed or non-Figma URLs with typed `FigmaError` (`INVALID_URL`).

### 2. Figma REST Client (`src/client.ts`)
- **`FigmaClient`**:
  - `getFile(fileKey, depth)`: Fetches file JSON node hierarchy via `/v1/files/${fileKey}`.
  - `getFileNodes(fileKey, nodeIds)`: Fetches targeted component subtrees via `/v1/files/${fileKey}/nodes`.
  - `getImageUrls(fileKey, nodeIds, format, scale)`: Fetches rendered vector and raster asset export URLs via `/v1/images/${fileKey}`.
  - **Fails Loudly per §75**: Requires valid `FIGMA_ACCESS_TOKEN`; throws typed `FigmaError` (`AUTHENTICATION_REQUIRED`) if token is missing.

### 3. Design IR Converter (`src/converter.ts`)
- **`DesignIRConverter.convert(figmaFile, fileKey)`**:
  - **Color Palette Extraction**: Converts float RGB values (0..1) to `#RRGGBB` hex and CSS `rgba()` tokens.
  - **Typography Token Extraction**: Maps font families, font sizes, font weights, line heights, and letter spacings.
  - **Spacing & Radii Scales**: Deduplicates `itemSpacing`, directional paddings, and corner radii into sorted numeric token arrays.
  - **Component & Layout Mapping**:
    - Translates Figma Auto-Layout (`HORIZONTAL` → flex row, `VERTICAL` → flex column, gaps, paddings).
    - Extracts dimensions (width, height) and bounding boxes.
    - Captures text content and text style bindings.
    - Identifies image fills and vector icons as `AssetIR` manifests (`svg`, `webp`).
    - Maps top-level frames into EDS section structures.
  - **Responsive Rules**: Default breakpoints for desktop (1024px+), tablet (768px–1023px), and mobile (<768px).

---

## 📑 Design IR Contract Example

```json
{
  "source": {
    "type": "figma",
    "fileKey": "xyz789def",
    "fileName": "Product Landing Page"
  },
  "designTokens": {
    "colors": {
      "#0f1117": { "hex": "#0f1117", "rgba": "rgba(15, 17, 23, 1)" },
      "#ffffff": { "hex": "#ffffff", "rgba": "rgba(255, 255, 255, 1)" }
    },
    "typography": {
      "inter-48-700": { "fontFamily": "Inter", "fontSize": 48, "fontWeight": 700, "lineHeight": 56 }
    },
    "spacing": [8, 16, 24, 32, 48],
    "radii": [4, 8, 16]
  },
  "components": [
    {
      "id": "1-2",
      "name": "Hero Block",
      "type": "frame",
      "dimensions": { "width": 1440, "height": 600 },
      "spacing": { "layoutMode": "horizontal", "gap": 24, "padding": { "top": 48, "right": 32, "bottom": 48, "left": 32 } },
      "colors": { "background": "#0f1117" },
      "assets": ["asset-1:4"],
      "children": [...]
    }
  ],
  "responsiveRules": [
    { "breakpoint": "desktop", "minWidth": 1024 },
    { "breakpoint": "tablet", "minWidth": 768, "maxWidth": 1023 },
    { "breakpoint": "mobile", "maxWidth": 767 }
  ]
}
```

---

## 🧪 Unit Tests (`packages/figma/test/figma.test.ts`)

8 passing unit tests:
1. **Standard URL Parsing**: Extracts fileKey from `/file/...`.
2. **Design URL Parsing**: Extracts fileKey and converts `node-id=1-42` to `1:42`.
3. **Malformed URL Rejection**: Throws `INVALID_URL` for invalid domains or missing keys.
4. **Authentication Guard**: Throws `AUTHENTICATION_REQUIRED` when access token is missing or whitespace.
5. **Client Initialization**: Clean initialization with valid token.
6. **Float Color Conversion**: Tests `#ffffff`, `#000000`, and `rgba()` CSS string outputs.
7. **Complete Design IR Transformation**: Validates tokens, auto-layout, typography, dimensions, and assets.
8. **Corrupted Document Handling**: Rejects invalid payloads with `IR_CONVERSION_FAILED`.

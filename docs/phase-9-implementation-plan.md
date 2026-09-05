# Phase 9 Implementation Plan — Figma REST Client & Design IR Converter (`@aeds/figma`)

## Overview
This document specifies the technical architecture, contracts, and test plans for **Phase 9: Figma REST Client & Design IR Converter (`@aeds/figma`)**.

---

## 🛠️ Architecture & Components

### 1. Types & Data Models (`src/types.ts`)
- **`FigmaClientConfig`**: `accessToken`, `apiUrl`, `timeoutMs`.
- **`FigmaFileResponse`**, **`FigmaNode`**, **`FigmaColor`**, **`FigmaTypeStyle`**: Type representations matching the Figma REST API v1.
- **`DesignIR`** (Product Vision §8):
  - `source`: Design source metadata (type: `figma`, fileKey, nodeId).
  - `pages`: Array of `PageIR`.
  - `designTokens`: `DesignTokens` (colors, typography scales, spacing, border radii).
  - `components`: Array of `ComponentIR` (id, name, type, hierarchy, dimensions, spacing, typography, colors, assets, behavior).
  - `assets`: Array of `AssetIR` (vector icons, images, export format).
  - `responsiveRules`: Breakpoint rules (`desktop: 1440`, `tablet: 768`, `mobile: 375`).

### 2. Error Classes (`src/errors.ts`)
- `FigmaError` with typed `FigmaErrorCode`:
  - `AUTHENTICATION_REQUIRED`: Fails loudly when token is missing (§75).
  - `INVALID_URL`: Malformed Figma URL.
  - `FILE_NOT_FOUND`: HTTP 404 from Figma API.
  - `NODE_NOT_FOUND`: Target frame or component node not found.
  - `RATE_LIMITED`: HTTP 429 with retry header.
  - `IR_CONVERSION_FAILED`: Schema conversion error.
  - `NETWORK_ERROR`: Connection failure.

### 3. Figma URL Parser (`src/parser.ts`)
- **`FigmaUrlParser`**:
  - Parses standard Figma file links (`https://www.figma.com/file/:fileKey/...`)
  - Parses modern Figma design links (`https://www.figma.com/design/:fileKey/...`)
  - Extracts target node IDs from query strings (e.g. `?node-id=1:2` or `?node-id=1-2`).

### 4. Figma Client (`src/client.ts`)
- Authenticated client for the Figma REST API:
  - `getFile(fileKey, depth)`: Retrieves the document node hierarchy.
  - `getFileNodes(fileKey, nodeIds)`: Retrieves specific nodes.
  - `getImageUrls(fileKey, nodeIds, format, scale)`: Fetches rendered raster/vector asset URLs.

### 5. Design IR Converter (`src/converter.ts`)
- Transforms raw Figma node trees into canonical `DesignIR`:
  - Extracts color tokens from solid paints (converted to `#RRGGBB` hex and CSS RGBA).
  - Extracts typography styles (font family, font size, font weight, line height, letter spacing).
  - Extracts layout constraints: auto-layout directions (`HORIZONTAL` → flex row, `VERTICAL` → flex column), gaps, paddings.
  - Identifies component candidates and maps them into EDS block-ready `ComponentIR` definitions.

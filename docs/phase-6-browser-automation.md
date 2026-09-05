# Phase 6 — Browser Automation & Testing

## Overview
Phase 6 implemented `@aeds/browser`, the headless browser automation and page audit adapter powered by Playwright. It enables autonomous AI agents to load live EDS pages, inspect block decoration and DOM structures, intercept network errors, extract console logs, run accessibility checks, and capture multi-viewport screenshots.

---

## 🛠️ Components Implemented

### 1. Browser Controller (`src/controller.ts`)
- **`BrowserController.launch()`**: Launches headless Chromium (or configured browser engine) with custom user-agent.
- **`auditPage(url, viewport, options)`**:
  - Sets viewport from preset matrix (`desktop`, `tablet`, `mobile`).
  - Attaches **Console Log Listeners**: captures `console.error`, `console.warn`, and stack locations.
  - Attaches **Network Failure Listeners**: captures failed HTTP requests (`requestfailed`) and 4xx/5xx responses.
  - Measures true navigation and load latencies.
  - Waits for EDS asynchronous block decoration pipeline (`data-block-status="loaded"`).
  - Inspects EDS DOM structure (`sectionsCount`, `blocksCount`, `detectedBlocks`).
  - Performs static accessibility heuristic audit (missing `alt` attributes, unlabelled interactive buttons).
  - Collects browser performance timing (`fcp`, `lcp`, `ttfb`).
  - Captures full-page screenshots (as file or base64).

### 2. Viewport Matrix (`src/types.ts`)
Standardized presets tailored for responsive testing:
- **`desktop`**: 1440x900
- **`tablet`**: 768x1024 (touch enabled)
- **`mobile`**: 375x812 (mobile user agent & touch enabled)

### 3. Error Handling (`src/errors.ts`)
Structured `BrowserError` with codes: `BROWSER_LAUNCH_FAILED`, `NAVIGATION_TIMEOUT`, `PAGE_CRASHED`, `SCREENSHOT_FAILED`, `NETWORK_FAILURE`, `AUDIT_FAILED`.

---

## 🧪 Unit Tests (`packages/browser/test/controller.test.ts`)
3 passing tests validating viewport configurations, error mapping, and controller lifecycle.

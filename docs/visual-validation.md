# Visual Validation

## Flow

```
Reference screenshot
  → Implementation screenshot (Playwright)
  → pixelmatch / perceptual diff
  → (optional) vision analysis
  → Mismatch report
  → AI fix → rebuild → compare again
```

Every iteration is stored; never overwrite previous evidence.

## Agent path

1. QA / live browser captures `browserScreenshots`
2. `VisualValidationAgent` needs baseline via `VISUAL_BASELINE_URL` or `context.visualBaselineUrl`
3. `VisualComparator.compare(baseline, candidate, { threshold })`
4. Evidence `PASS`/`FAIL` with score metrics

## Async path

`workers/visual-worker` consumes `visual-tests` jobs (`baselineUrl`, `candidateUrl`, viewports, tolerance).

## Env

```bash
ENABLE_LIVE_VISUAL=true
VISUAL_BASELINE_URL=https://…/baseline.png
QG_VISUAL_THRESHOLD=95
```

## Outcomes

| Status | Meaning |
|---|---|
| PASS | Score ≥ threshold with real comparison |
| FAIL | Comparison ran; below threshold |
| SKIPPED | No screenshots/baseline — **not** PASS |
| UNAVAILABLE | Live requested but fetch/compare failed |

## Tracks

Layout, spacing, typography, colors, images, borders, responsive behavior, alignment, component size (via diff clusters / bounding boxes).

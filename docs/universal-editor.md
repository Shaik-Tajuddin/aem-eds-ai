# Universal Editor

## Goal

Configure and validate authoring contracts so content is editable and persisted correctly.

## Artifacts

- `_component-definition.json`
- `_component-models.json`
- `_component-filters.json`
- `data-aue-*` DOM instrumentation

## Classes (`@aeds/aem`)

| Class | Role |
|---|---|
| `UniversalEditorModelGenerator` | Build UE JSON from block manifests |
| `UniversalEditorValidator` | Validate schemas + instrumentation |
| `UniversalEditorTester` | Compare authored vs persisted vs rendered values (logic tests) |

## Agent

`UniversalEditorAgent` generates/updates UE artifacts during `UE_AUTHORING`.

## Live authoring loop (status)

| Capability | Status |
|---|---|
| UE JSON models/filters | ✅ |
| Offline authoring tester | ✅ |
| Live `data-aue-*` instrumentation check | ✅ (`ENABLE_LIVE_UE=true`) |
| Full UE chrome SSO edit → save → reopen | ✅ gated (`ENABLE_LIVE_UE_AUTHORING` + `UE_STORAGE_STATE_PATH` / `UE_EDITOR_URL`; UNAVAILABLE without session) |
| Tenant selector overrides | ✅ `UE_FIELD_SELECTOR`, `UE_SAVE_SELECTOR`, `UE_CHROME_SELECTOR`, `UE_LOGIN_HINTS` |

Live instrumentation uses Playwright against a preview URL and records PASS/FAIL/UNAVAILABLE evidence — never claims success without DOM attributes.

Live authoring opens authenticated UE chrome via Playwright storage state, attempts edit→save→reopen, and only returns PASS when all phases succeed. Missing session/file/Save control → UNAVAILABLE (not PASS).

Optional content reopen: after DOM reload, `verifyUeReopenViaContent` re-reads the page via MCP/JCR (`UE_CONTENT_PAGE_URL` / `AEM_AUTHOR_URL`). Status is recorded as `reopenContent` (PASS/FAIL/UNAVAILABLE/SKIPPED) and never invents success.

Successful and unsuccessful phase outcomes are persisted to `ue_authoring_tests` (one row per phase / instrumentation check), returned on `GET /api/runs/:id`, and summarized on `GET /api/ue/authoring-tests` for the UE dashboard.

The `/dashboard/ue` demo matrix shows **NOT_RUN** until bound to run evidence (no invented PASS).

## Auth reminder

AEM API credentials ≠ UE browser session credentials. Neither belongs in frontend EDS code.

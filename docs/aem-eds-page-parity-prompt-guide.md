# AEM & EDS Page Parity — Track A / Track B Operational Guide

This guide covers **content + visual parity** between a reference AEM page and a destination EDS author page using **aem-cloud MCP**, with or without a code PR.

## Track A vs Track B

| Track | Purpose | When |
|-------|---------|------|
| **A — Orchestrator run** | Generate blocks / UE models → quality gates → **GitHub PR** | Only when new or changed EDS code is needed |
| **B — Page parity** | MCP **write-api** authors destination JCR → optional CSS/JS → browser verify | **Anytime** — standalone or after a PR |

Pipeline stage `UE_AUTHORING` writes **repo UE JSON contracts**. It does **not** replace Track B MCP JCR authoring.

```
Project exists
    │
    ├─ Need new blocks/code? ──yes──► Track A (POST /api/runs → PR)
    │                                      │
    │                                      ▼
    └─ Content-only / after PR ────────► Track B (MCP author + verify)
                                              │
                                              ▼
                                         ue_authoring_tests evidence
```

---

## Standalone Track B (no new blocks, no PR)

Use when EDS blocks already exist and you only need destination **content**.

### Inputs

| Field | Source |
|-------|--------|
| Reference | `project_configs.source_url` or prompt URL |
| Destination | `environments.authoring_path` (+ `author_url`) |
| Code ref | Existing branch (`main` / `dev`) as `?ref=` — **not** a new PR branch |

### Option 1 — Dashboard (no Cursor)

1. Open the **project** page → **Author page content**, or **/dashboard/ue** → **Author page content**.
2. API: `POST /api/parity` with `{ "projectId": "…", "fixCss": false, "branch": "main" }`.
3. Server uses `AEM_MCP_ACCESS_TOKEN` against `AEM_MCP_WRITE_URL` (default `https://mcp.adobeaemcloud.com/adobe/mcp/aem`).
4. Evidence appears under Universal Editor (`ue_authoring_tests`, block `page-parity`).

### Option 2 — Cursor chat (aem-cloud MCP connected)

```markdown
Author the destination page to match the reference using aem-cloud MCP only (no new blocks, no PR):

- Reference: <REF_URL>
- Target author path: <AUTHORING_PATH> on <AUTHOR_URL>
- Code ref for preview: ?ref=<existing-branch> (e.g. main or dev)

Phase 1: read-api — resolve pageIds, get content trees, DAM assets; diff reference vs target.
Phase 2: write-api — put/patch Franklin tree on target (ETag); verify with read-api.
Phase 3: Open target ...html?ref=<existing-branch> (and/or UE canvas); confirm structure.
Phase 4 (optional): Only if visuals differ, adjust CSS/JS on that existing branch — otherwise stop.
```

### Option 3 — CLI

`node scratch/execute_authoring_mcp.mjs` (and related `scratch/*parity*.mjs`) with an Adobe MCP write token.

Do **not** start `POST /api/runs` only to author content — that re-runs Track A and may open an unnecessary PR.

---

## After Track A PR

When a run is `PR_CREATED` / `WAITING_APPROVAL`:

1. Run detail → **Author content & verify** (sends `runId`; uses PR head as `?ref=` when present).
2. Or Cursor master prompt below with `?ref=<PR-branch>`.
3. Optional CSS/JS pushes on the PR branch; cache-bust with a fresh ref if the author proxy caches assets.
4. Human **Approve deployment** / merge when ready.

### Cursor master prompt (full parity including CSS)

For the **WKND FAQs** run (accordion model, 8/3 sidebar CSS, browser IMS/CDN workarounds), use the hardened paste prompt in [master-prompt-aem-eds-faq-parity-browser.md](./master-prompt-aem-eds-faq-parity-browser.md).

```markdown
Perform an end-to-end visual and content parity alignment between the reference page and the target EDS author page:

- Reference Page: <REFERENCE_PAGE_URL>
- Target Author Page: <TARGET_AUTHOR_PAGE_URL> (include ?ref=<BRANCH>)
- GitHub Repository: <REPO_OWNER>/<REPO_NAME>
- Working Branch: <BRANCH_NAME>
- AEM Local Admin Credentials: <USERNAME>:<PASSWORD>

### Phase 1: Content Difference Analysis & Asset Discovery (MCP)
1. Use aem-cloud MCP (`read-api`) on both pages.
2. Diff components, headings, text, cards.
3. Resolve DAM paths under `/content/dam/...`.

### Phase 2: Automated Content Authoring (MCP)
1. `write-api` put/patch target Franklin tree (ETag).
2. Prefer DAM image references for Dynamic Media.

### Phase 3: Design / Block Code (GitHub) — only if needed
1. Update `blocks/<block>/*.{js,css}` and `styles/styles.css`; preserve `data-aue-*`.
2. If CSS is cached, use a fresh `?ref=`.

### Phase 4: Browser verification
1. Use browser tools (`cursor-ide-browser`) on reference + target.
2. On AEM Cloud login, use "Sign in locally (Admin Tasks only)" + local admin.
3. Screenshots both pages.

### Phase 5: Evidence
1. Confirm alignment; log `ue_authoring_tests` / walkthrough.
```

**Browser subagent** in this product sense = Cursor `cursor-ide-browser` (interactive) or the API’s Playwright audit on `POST /api/parity` (`verifyBrowser: true`).

---

## API reference

### `POST /api/parity`

```json
{
  "projectId": "<uuid>",
  "runId": "<uuid optional>",
  "referenceUrl": "optional override",
  "targetAuthorPath": "optional override",
  "branch": "main",
  "fixCss": false,
  "verifyBrowser": true,
  "contentTree": null
}
```

- Without `contentTree`, copies the **reference** experimental page content onto the **target** (PUT with ETag).
- `fixCss: true` records a **SKIPPED** `css-fix` phase (API does not rewrite GitHub files); use Cursor or a manual PR for CSS.
- Creates a lightweight `agent_runs` row when `runId` is omitted (standalone).
- Preserves `WAITING_APPROVAL` / `PR_CREATED` when `runId` points at an existing gated run.

### `GET /api/parity/latest?projectId=`

Recent page-parity run snapshots.

### Auth env

| Variable | Role |
|----------|------|
| `AEM_MCP_ACCESS_TOKEN` | OAuth access token from Cursor **aem-cloud** login (required for write) |
| `AEM_MCP_WRITE_URL` | Default `https://mcp.adobeaemcloud.com/adobe/mcp/aem` |
| `AEM_MCP_URL` | Often `content-readonly` for Track A capture — prefer `AEM_MCP_WRITE_URL` for Track B |

See also [aem-cloud-mcp-authoring-plan.md](./aem-cloud-mcp-authoring-plan.md) for payload shapes and OAuth audience details.

---

## Architecture (why this works)

```
+------------------------+        +---------------------------+        +---------------------------+
| 1. aem-cloud MCP       | -----> | 2. Optional GitHub CSS    | -----> | 3. Browser verify         |
| - read-api inspect     |        | - blocks/* / styles.css   |        | - API Playwright and/or   |
| - write-api author     |        | - preserve data-aue-*     |        |   Cursor browser subagent |
+------------------------+        +---------------------------+        +---------------------------+
                                                                                     |
                                                                                     v
                                                                       +---------------------------+
                                                                       | ue_authoring_tests         |
                                                                       +---------------------------+
```

1. **Local admin auth** — Cloud author IMS; use “Sign in locally (Admin Tasks only)” for interactive browsers.
2. **DAM assets** — Prefer `/content/dam/...` so Dynamic Media `<picture>` URLs generate.
3. **`?ref=`** — Selects Git branch for `/content/<site>.<ref>.resource/` CSS/JS; use a fresh ref if cached.
4. **UE compatibility** — Preserve `data-aue-*` when decorating blocks.

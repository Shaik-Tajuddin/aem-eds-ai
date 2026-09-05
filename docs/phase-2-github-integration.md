# Phase 2 — GitHub Integration & Git Data API

## Overview
Phase 2 implemented `@aeds/github`, the dedicated adapter bridging autonomous AI agents and GitHub repositories. It replaces mocked git actions with authentic Octokit integrations, supporting multi-file atomic commits via the Git Data API, branch lifecycle management, EDS configuration detection, and evidence-backed Pull Requests.

---

## 🛠️ Components Implemented

### 1. GitHub Adapter (`packages/github/src/adapter.ts`)
- **`GitHubAdapter.parseRepoUrl(url)`**: Parses various URL formats (`owner/repo`, `https://github.com/owner/repo`, `https://github.com/owner/repo.git`) and extracts owner/repo slugs.
- **`getRepository(owner, repo)`**: Fetches metadata and verifies AEM Edge Delivery Services characteristics:
  - Detects `fstab.yaml` (EDS mount points)
  - Detects `scripts/scripts.js` (EDS block loader pipeline)
  - Detects `.helix/config.json` (Helix indexing configuration)
- **`branchExists(owner, repo, branchName)`**: Checks branch presence without throwing on 404s.
- **`createBranch(owner, repo, branchName, fromBranch?)`**: Resolves base SHA and creates new branch refs.
- **`getFileContent(owner, repo, path, ref?)`**: Fetches file blobs and decodes UTF-8/base64 content.

### 2. Atomic Multi-File Commits
The `commitFiles` method allows an autonomous agent to commit dozens of modified and created files simultaneously without cloning the repository locally:
1. Calls `git.getRef` to fetch latest parent commit SHA.
2. Calls `git.getCommit` to retrieve base tree SHA.
3. Calls `git.createBlob` for every new/modified file content.
4. Calls `git.createTree` building a unified tree with all file changes.
5. Calls `git.createCommit` referencing parent commit and new tree.
6. Calls `git.updateRef` pointing branch reference to the newly generated commit.

### 3. Evidence-Backed Pull Requests
`createPullRequest` creates rich Markdown pull requests containing:
- **Live EDS Preview URL**: `https://${headBranch}--${repo}--${owner}.hlx.page/`
- **Lighthouse Performance Score**: Embedded badge and score.
- **Visual Regression Checks**: Verification summary.
- **Automated QA Checklist**: Detailed file changes and test confirmations.

### 4. Token Security Manager (`packages/github/src/token-manager.ts`)
- Validates tokens and checks granted OAuth scopes (`repo`, `workflow`, `read:org`).
- Masks token values for safe logging (`ghp_...0xyz`).

### 5. Fastify API Endpoints (`apps/api/src/routes/github.ts`)
- `POST /api/github/validate-token` — Tests token authenticity and returns user scopes.
- `POST /api/github/validate-repo` — Validates repo access and reports detected EDS files.
- `POST /api/github/repo/:owner/:repo/branches` — Creates branches for new runs.
- `POST /api/github/repo/:owner/:repo/pull-requests` — Generates evidence-backed PRs.

---

## 🧪 Unit Tests (`packages/github/test/adapter.test.ts`)
9 passing tests covering URL parsing, token management, error mapping (401, 403, 404, rate limits).

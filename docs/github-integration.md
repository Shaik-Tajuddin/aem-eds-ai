# GitHub Integration

Package: `@aeds/github`

## Capabilities

- Parse `owner/repo` and GitHub URLs
- Detect EDS repos (`fstab.yaml`, `scripts/scripts.js`, helix markers)
- Create branches, atomic multi-file commits (Git Data API), open PRs
- Optional workflow run polling

## Tokens

| Use | Variable |
|---|---|
| OAuth (web login) | `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` |
| API automation | `GITHUB_TOKEN` (PAT or App) |

Per-project tokens may be encrypted in DB.

## Agent workflow

```
clone/analyze → branch ai/<project>/<task> (or aeds/run-<id>)
→ modify → commit → build/lint evidence → PR
```

`DeploymentAgent` runs local `build:json` + `lint` preparation, then opens PR when token present.

Disable publish:

```bash
ENABLE_GITHUB_PUBLISH=false
```

## PR body expectations

Summary, architecture decisions, files changed, tests, visual, a11y, performance, UE, fix iterations, limitations, run ID, evidence references.

## Never

- Auto-merge to production unless explicitly configured
- Commit secrets
- Claim PR success without GitHub API evidence

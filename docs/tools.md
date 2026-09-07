# Tool Registry

Package: `@aeds/tools`

## Flow

```
LLM → Tool Request → Policy Engine → Validation → Tool Executor → Result
```

No unrestricted shell access from the LLM.

## Components

- **`ToolRegistry`**: register / list / execute with timeouts and sanitized I/O
- **`ToolPolicyEngine`**: scope + risk gates
- **`sanitizeValue`**: recursive secret redaction (`ghp_*`, `sk-*`, password/token keys)

## Risk tiers

| Risk | Behavior |
|---|---|
| low / medium | Allowed in scope |
| high | Requires approval unless auto-approved |
| critical | Human approval interception |

## Namespaces (typed)

`github`, `figma`, `aem`, `browser`, `testing`, `visual`, `build`, `filesystem`, `knowledge`

## Build / test workers

Allowlisted commands only (`npm run …`, `npm test`, `npx …`, `node …`) via `runAllowlistedCommand` in `@aeds/queue`. Metacharacters and path traversal are rejected.

## Current gap

Orchestrator constructs an empty `ToolRegistry` by default. Infrastructure and tests exist; production tool handler registration is ongoing. Prefer registering tools over ad-hoc agent side effects.

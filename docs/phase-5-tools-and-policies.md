# Phase 5 — Tool Registry, Policy Engine & Security

## Overview
Phase 5 implemented `@aeds/tools`, providing a sandboxed catalog of tools callable by autonomous agents. It enforces project scope boundaries, risk-level human confirmation gates, strict execution timeouts, and automatic secret redaction on all parameters and return values.

---

## 🛠️ Components Implemented

### 1. Tool Registry (`src/registry.ts`)
- Registers tools with full metadata: namespace (`github`, `figma`, `aem`, `browser`, `testing`, `visual`, `build`), JSON Schema parameter definitions, risk level, and timeout.
- Manages typed asynchronous execution handlers with contextual run ID and project ID.
- Returns standardized `ToolResult` and detailed `ToolCall` records.

### 2. Policy Engine & Approval Gates (`src/policy.ts`)
Evaluates invocation permissions prior to tool execution:
- **Scope Verification**: Ensures the tool is permitted in the active project scope (`tool.allowedInScopes`).
- **Risk Classification**:
  - `low`: Read-only actions (inspect file, check status). Executed automatically.
  - `medium`: Non-destructive writes (create branch, format file).
  - `high` & `critical`: Destructive or public actions (deploy production, force push, purge cache).
- **Human Approval**: Critical risk tools or tools with `requiresApproval: true` are intercepted, returning status `ToolStatus.PENDING` (`APPROVAL_REQUIRED`) until approved by an operator.

### 3. Secret Redactor & Data Sanitizer (`src/sanitizer.ts`)
Ensures no credentials, passwords, or tokens leak into logs or database audit trails:
- **Key Pattern Matching**: Inspects object keys matching `/token/i`, `/secret/i`, `/password/i`, `/api[_-]?key/i`, `/auth/i`, `/private[_-]?key/i`, `/credential/i`, `/bearer/i` and masks values to `******` or `prefix...suffix`.
- **String Value Regex Scanning**: Scans string payloads for known token signatures such as `ghp_[a-zA-Z0-9]{30,}` or `sk-[a-zA-Z0-9]{32,}` and replaces them with `ghp_******` and `sk-******`.

### 4. Timeout Enforcement
Executes tools against a strict `Promise.race` timeout timer (`tool.timeoutMs`, default: 30,000ms). If a tool exceeds its allowed duration, execution is cancelled and recorded as `ToolStatus.TIMEOUT`.

---

## 🧪 Unit Tests (`packages/tools/test/registry.test.ts`)
5 passing tests validating secret redaction on objects and raw strings, scope restriction blocking, approval gating on critical actions, successful execution, and graceful missing tool handling.

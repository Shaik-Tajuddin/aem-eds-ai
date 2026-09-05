# Walkthrough — AI Activity Observatory & Runs Manager

## Overview
This document details the user interface and functionality of the **AI Activity Observatory** (`/dashboard/activity`) and the **Autonomous Agent Runs Manager** (`/dashboard/runs`), including the interactive State Machine Inspector modal.

---

## 🔍 AI Activity Observatory (`/dashboard/activity`)

The Observatory serves as the real-time window into the agent's actions, distinguishing structured AI claims from verified system execution evidence.

### Key Capabilities
- **Claim vs Evidence Distinction**:
  - `🤖 AI Proposal`: Stated hypotheses, architectural choices, and planned file modifications.
  - `🛡️ Execution Evidence`: Hard verification results produced by browser runs, Git commits, Lighthouse audits, and Playwright tests.
- **Collapsible Technical Evidence Drawer**:
  - Click any event card to view the underlying technical proof.
  - **Git Diff Snippet**: Colorized additions (`+`) and deletions (`-`).
  - **Token & Latency Metrics**: Token consumption and elapsed milliseconds.
  - **Sanitized Tool Output**: Parameter and return values with sensitive tokens automatically masked.
- **Search & Multi-Dimensional Filtering**:
  - Instant text filter across intent, actor, and run ID.
  - Project selector dropdown.
  - Agent role dropdown (`EDS Developer`, `Architect`, `QA`, `Fix`, `Deployment`).
  - Event type filter (`Decisions`, `Tool Calls`, `Code Changes`, `QA Audits`, `Defect Fixes`, `Errors`).
- **Live SSE Streaming**: Toggleable simulated live stream with pulsating status dot.

### Screenshot
![AI Activity Observatory](./images/activity_observatory_1788644184869.png)

---

## ⚡ Agent Runs Manager (`/dashboard/runs`)

The Runs Manager provides control and visibility over all autonomous pipeline runs.

### Key Capabilities
- **Status Filter Tabs**: Filter across All Runs, Running, Completed, or Failed runs.
- **Run Cards**:
  - Display run ID, project name, input source badge (`FIGMA`, `AEM_PAGE`, `EXISTING_WEBSITE`), branch name, started timestamp, and elapsed runtime.
  - Status badges (`PR_CREATED`, `IMPLEMENTING`, `QUALITY_GATE`, `FAILED`, `PAUSED`).
  - Smooth progress bar reflecting completion across the 18 pipeline phases.
  - **Fix Iterations Counter**: Displays current vs maximum allowed fix iterations (e.g. `1 / 5`).
- **Quality Gates Dashboard**:
  - Real-time indicator pills for **Build**, **Unit Tests**, **Visual Regression %**, **Accessibility (A11y)**, and **Lighthouse Performance**.
- **Actions**:
  - **Live EDS Preview**: Direct link to the live Franklin/Helix CDN environment (`.hlx.page`).
  - **View Pull Request**: Direct link to the generated GitHub PR.
  - **Pause / Resume**: Toggle execution state.
  - **🔍 Inspect State Machine**: Launches the full state machine inspector modal.

### Screenshot
![Agent Runs & State Machine Inspector](./images/runs_view_state_machine_modal_1788644214888.png)

---

## 🧭 Navigation Health
Every single navigation item in the dashboard sidebar has a dedicated route and view with zero 404 errors:
- `/dashboard` — Overview & KPI Strip
- `/dashboard/projects` — Projects Grid & Wizard
- `/dashboard/runs` — Agent Runs Manager
- `/dashboard/activity` — AI Activity Observatory
- `/dashboard/tools` — Tool Calls & Policies
- `/dashboard/code` — Code Changes & Diffs
- `/dashboard/tests` — Test Runner & Quality Gates
- `/dashboard/visual` — Visual Regression QA
- `/dashboard/ue` — Universal Editor Models
- `/dashboard/bugs` — Defect Remediation Hub
- `/dashboard/deployments` — Deployments & PR Assistant
- `/dashboard/usage` — LLM Usage & Token Analytics
- `/dashboard/knowledge` — Knowledge Base (RAG)
- `/dashboard/settings` — Platform & Integration Settings

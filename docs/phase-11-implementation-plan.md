# Phase 11: Distributed BullMQ Queue Workers & Job Processing Architecture

## Executive Overview

In Phase 11, the AI EDS Developer platform was augmented with a production-grade distributed job processing architecture based on **BullMQ** and **Redis 7**. 

Prior to Phase 11, pipeline execution occurred synchronously in-process, which risked process exhaustion, worker memory spikes during headless Playwright browser runs, and single-point-of-failure restarts.

Phase 11 introduces:
1. **`@aeds/queue`**: Core package defining strongly typed Zod job contracts, Redis connection managers with resilient reconnect strategies, metric aggregators, and mock queue fallbacks for offline testing.
2. **`workers/agent-worker`**: Dedicated background daemon executing the 18-stage autonomous pipeline via `AgentOrchestrator`, reporting live progress events to the database and BullMQ.
3. **`workers/browser-worker`**: Dedicated Playwright automation worker for preview URL verification, A11y auditing, and console error detection with automatic fallback for test environments.
4. **`apps/api` Queue Dispatcher**: Integration in Fastify API routes (`POST /api/runs` and `GET /api/runs/queues/metrics`) to dispatch runs to BullMQ.
5. **`apps/web` Queues & Workers Dashboard (`/dashboard/queues`)**: Real-time observability dashboard displaying queue metrics, daemon health status, and live job streams.

---

## 🏗️ Architecture & Component Design

```
                     ┌─────────────────────────────┐
                     │     apps/api (Fastify 5)    │
                     │  - POST /api/runs           │
                     │  - GET /api/runs/queues/... │
                     └──────────────┬──────────────┘
                                    │ enqueueAgentRun()
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │             Redis 7.2 (ioredis Cluster)                │
       │                                                         │
       │  ┌─────────────────┐ ┌─────────────────┐ ┌───────────┐  │
       │  │  "agent-runs"   │ │ "browser-tests" │ │"visual-   │  │
       │  │      Queue      │ │      Queue      │ │  tests"   │  │
       │  └────────┬────────┘ └────────┬────────┘ └─────┬─────┘  │
       └───────────┼───────────────────┼────────────────┼────────┘
                   │                   │                │
                   ▼                   ▼                ▼
     ┌────────────────────────┐  ┌────────────────────────┐
     │  workers/agent-worker  │  │ workers/browser-worker │
     │  - Master Orchestrator │  │ - Playwright Audits    │
     │  - 18 State Machine    │  │ - Block Decoration     │
     │  - Concurrency: 2      │  │ - Concurrency: 1       │
     └────────────────────────┘  └────────────────────────┘
```

---

## 📦 Detailed Deliverables

### 1. `@aeds/queue` Package
- **Job Schemas**:
  - `AgentRunJobSchema`: Zod validation schema for runId, projectId, repository credentials, source type, and max iterations.
  - `BrowserTestJobSchema`: Validates previewUrl, viewports (`desktop`, `tablet`, `mobile`), and target block names.
  - `VisualTestJobSchema`: Validates referenceScreenshot, implementationScreenshot, and diff threshold.
- **Connection Resilience**:
  - Fast-exit connection timeout (500ms) in test environments to eliminate test suite stalls.
  - Exponential backoff retry strategy (`Math.min(times * 100, 3000)`).
- **Metric Aggregator**:
  - `getQueueMetrics(name)` and `getAllQueueMetrics()` providing real-time counts for waiting, active, completed, failed, and delayed jobs.

### 2. `workers/browser-worker`
- **Playwright Controller Integration**:
  - Automatically launches headless Chromium instances to audit EDS preview pages.
  - Verifies DOM decoration of blocks (`.block[data-block-status="loaded"]`).
  - Records execution metrics and evidence screenshots directly to the `test_runs` PostgreSQL table.

### 3. `workers/agent-worker`
- **Master Orchestrator Worker**:
  - Consumes incoming `AgentRunJobData`.
  - Spawns and manages the 18-stage state machine.
  - Emits real-time progress events and updates the `agent_runs` table upon completion or error.

### 4. `apps/web` Queue Telemetry Dashboard (`/dashboard/queues`)
- Real-time Redis 7 cluster connection status indicator.
- Cards for each queue (`agent-runs`, `browser-tests`, `visual-tests`) with active, waiting, completed, and failed counts.
- Dedicated Worker Daemons inspector tracking node health, PID, and concurrency.
- Interactive job dispatcher with simulated or live telemetry streaming.

---

## 🧪 Verification & Results

- **Global Monorepo Typecheck**: All 25 workspace tasks pass with 0 errors.
- **Full Test Suite Execution**: 22 out of 22 test tasks passing across all packages and workers.
- **Browser Subagent Visual Verification**: Verified at `http://localhost:3000/dashboard/queues`.
- **Screenshot Artifact**: `docs/images/queues_telemetry_1788647227891.png`.

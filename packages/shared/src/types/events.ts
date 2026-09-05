import type { AgentEventType, EventActor, RunStatus } from '../enums/index.js';

// ============================================================
// Canonical Agent Event
// ============================================================
export interface AgentEvent {
  id: string;
  runId: string;
  projectId: string;
  timestamp: string; // ISO 8601
  type: AgentEventType;
  actor: EventActor;
  step: string;
  status: 'started' | 'completed' | 'failed';
  data: Record<string, unknown>;
  // Never contains: secrets, API keys, private chain-of-thought
}

// ============================================================
// State Transition Event
// ============================================================
export interface RunStateEvent {
  runId: string;
  projectId: string;
  previousStatus: RunStatus;
  newStatus: RunStatus;
  timestamp: string;
  reason?: string;
}

// ============================================================
// LLM Call Event
// ============================================================
export interface LLMCallEvent {
  id: string;
  runId: string;
  provider: string;
  model: string;
  timestamp: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  status: 'success' | 'failed' | 'retried';
  estimatedCost?: number;
  // NEVER include prompt content, API keys, or user data in events
}

// ============================================================
// Tool Call Event
// ============================================================
export interface ToolCallEvent {
  id: string;
  runId: string;
  toolName: string;
  timestamp: string;
  durationMs?: number;
  status: 'started' | 'success' | 'failed' | 'denied' | 'timeout';
  // input and output are sanitized — no secrets
  sanitizedInput?: Record<string, unknown>;
  sanitizedOutput?: Record<string, unknown>;
  error?: string;
}

// ============================================================
// File Change Event
// ============================================================
export interface FileChangeEvent {
  runId: string;
  path: string;
  operation: 'create' | 'modify' | 'delete';
  timestamp: string;
  reason?: string;
  linesAdded?: number;
  linesRemoved?: number;
}

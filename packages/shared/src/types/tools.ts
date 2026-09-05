import type { ToolStatus } from '../enums/index.js';

// ============================================================
// Tool Registry Types
// ============================================================

export interface ToolDefinition {
  name: string;
  namespace: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval?: boolean;
  timeoutMs: number;
  allowedInScopes: string[]; // project IDs or '*'
}

export interface ToolCall {
  id: string;
  runId: string;
  toolName: string;
  namespace: string;
  status: ToolStatus;
  riskLevel: string;
  // input/output sanitized — secrets redacted
  sanitizedInput?: Record<string, unknown>;
  sanitizedOutput?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
  timestamp: string;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  errorClass?: string;
}

// ============================================================
// Tool namespaces (matches registry)
// ============================================================
export type ToolNamespace =
  | 'github'
  | 'figma'
  | 'aem'
  | 'browser'
  | 'testing'
  | 'visual'
  | 'build'
  | 'filesystem'
  | 'knowledge';

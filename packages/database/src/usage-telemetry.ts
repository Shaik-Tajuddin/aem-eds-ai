// ============================================================
// Usage telemetry — persist llm_calls / tool_calls from agent events
// Never stores prompts, responses, or secrets.
// ============================================================

import { eq, sql } from 'drizzle-orm';
import { agentRuns, llmCalls, toolCalls } from './schema/index.js';

/** Minimal drizzle client surface used by telemetry writers. */
type Db = {
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
};

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
}

/**
 * Persist an llm.completed / llm.failed event into llm_calls and bump run totals.
 */
export async function persistLlmUsageFromEvent(
  db: Db,
  runId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const type = String(eventType);
  if (type !== 'llm.completed' && type !== 'llm.failed') return;

  const provider =
    (typeof payload.provider === 'string' && payload.provider) ||
    (typeof payload.llmProvider === 'string' && payload.llmProvider) ||
    'unknown';
  const model =
    (typeof payload.model === 'string' && payload.model) ||
    (typeof payload.llmModel === 'string' && payload.llmModel) ||
    'unknown';
  const inputTokens = asNumber(payload.inputTokens) ?? 0;
  const outputTokens = asNumber(payload.outputTokens) ?? 0;
  const latencyMs = asNumber(payload.latencyMs) ?? 0;
  const estimatedCostUsd = asNumber(payload.estimatedCostUsd) ?? 0;
  const status = type === 'llm.completed' ? 'success' : 'failed';

  await db.insert(llmCalls).values({
    runId,
    provider,
    model,
    inputTokens,
    outputTokens,
    latencyMs,
    status,
    estimatedCostUsd,
    retryCount: asNumber(payload.attempt) ? Math.max(0, (asNumber(payload.attempt) || 1) - 1) : 0,
  });

  await db
    .update(agentRuns)
    .set({
      totalLLMCalls: sql`COALESCE(${agentRuns.totalLLMCalls}, 0) + 1`,
      estimatedCostUsd: sql`COALESCE(${agentRuns.estimatedCostUsd}, 0) + ${estimatedCostUsd}`,
      updatedAt: new Date(),
    })
    .where(eq(agentRuns.id, runId));
}

/**
 * Persist a tool.completed event into tool_calls and bump run totals.
 */
export async function persistToolUsageFromEvent(
  db: Db,
  runId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const type = String(eventType);
  if (type !== 'tool.completed') return;

  const toolName = typeof payload.toolName === 'string' ? payload.toolName : 'unknown';
  const namespace = toolName.includes('.') ? toolName.split('.')[0]! : 'unknown';
  const success = payload.success !== false && payload.status !== 'FAILED' && payload.status !== 'DENIED';
  const status =
    typeof payload.status === 'string'
      ? payload.status
      : success
        ? 'SUCCESS'
        : 'FAILED';
  const riskLevel = typeof payload.riskLevel === 'string' ? payload.riskLevel : 'unknown';
  const durationMs = asNumber(payload.durationMs);
  const error = typeof payload.error === 'string' ? payload.error : null;

  await db.insert(toolCalls).values({
    runId,
    toolName,
    namespace,
    status,
    riskLevel,
    sanitizedInput: typeof payload.sanitizedInput === 'object' ? payload.sanitizedInput : {},
    sanitizedOutput: typeof payload.sanitizedOutput === 'object' ? payload.sanitizedOutput : null,
    error,
    durationMs,
  });

  await db
    .update(agentRuns)
    .set({
      totalToolCalls: sql`COALESCE(${agentRuns.totalToolCalls}, 0) + 1`,
      updatedAt: new Date(),
    })
    .where(eq(agentRuns.id, runId));
}

export async function persistUsageFromAgentEvent(
  db: Db,
  runId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await persistLlmUsageFromEvent(db, runId, eventType, payload);
  await persistToolUsageFromEvent(db, runId, eventType, payload);
}

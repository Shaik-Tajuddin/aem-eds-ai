// ============================================================
// @aeds/agent — executeTool helper for agents
// ============================================================

import type { ToolResult } from '@aeds/shared';
import type { PendingToolApproval } from '@aeds/tools';
import type { RunExecutionContext } from './agents/base.js';

/**
 * Execute a registered tool via the context registry with audit-friendly logging.
 * Does not invent success — returns ToolResult as produced by the registry.
 * On APPROVAL_REQUIRED, emits `tool.approval_required` so the API can persist
 * the pending call into agent_runs.state_snapshot for durable completion.
 */
export async function executeTool(
  context: RunExecutionContext,
  toolName: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const { result, record } = await context.toolRegistry.execute(toolName, input, {
    runId: context.runId,
    projectId: context.projectId,
    // Orchestrator agents are trusted; critical / requiresApproval tools still gate.
    autoApproveHighRisk: true,
  });

  context.log(
    `tool ${toolName} → ${record.status}${record.error ? `: ${record.error}` : ''} (${record.durationMs ?? 0}ms)`,
    result.success ? 'info' : 'warn',
  );
  context.emit('tool.completed', {
    toolName,
    status: record.status,
    durationMs: record.durationMs,
    success: result.success,
    error: record.error,
    errorClass: result.errorClass,
    callId: record.id,
  });

  if (result.errorClass === 'APPROVAL_REQUIRED') {
    const pending =
      context.toolRegistry.getPendingApproval(record.id) ||
      ({
        callId: record.id,
        toolName,
        namespace: record.namespace,
        riskLevel: record.riskLevel,
        runId: context.runId,
        projectId: context.projectId,
        input,
        sanitizedInput: (record.sanitizedInput || {}) as Record<string, unknown>,
        createdAt: record.timestamp,
        reason: result.error,
      } satisfies PendingToolApproval);

    context.emit('tool.approval_required', {
      callId: pending.callId,
      toolName: pending.toolName,
      namespace: pending.namespace,
      riskLevel: pending.riskLevel,
      runId: pending.runId,
      projectId: pending.projectId,
      input: pending.input,
      sanitizedInput: pending.sanitizedInput,
      createdAt: pending.createdAt,
      reason: pending.reason,
      status: 'PENDING',
      message: `Tool ${toolName} requires human approval (callId=${pending.callId})`,
    });
  }

  return result;
}

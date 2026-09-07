// ============================================================
// @aeds/tools — Tool Registry
// Manages tool catalog, schema validation, and secure execution
// ============================================================

import { ToolStatus } from '@aeds/shared';
import type { ToolDefinition, ToolCall, ToolResult, ToolNamespace } from '@aeds/shared';
import { ToolPolicyEngine, type PolicyEvaluationContext } from './policy.js';
import { sanitizeValue } from './sanitizer.js';

export type ToolHandler<TInput = any, TOutput = any> = (
  input: TInput,
  context: { runId: string; projectId: string }
) => Promise<TOutput>;

export interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

/** Serializable pending approval (safe to persist; input may still contain non-secret params). */
export interface PendingToolApproval {
  callId: string;
  toolName: string;
  namespace: string;
  riskLevel: string;
  runId: string;
  projectId: string;
  input: Record<string, unknown>;
  sanitizedInput: Record<string, unknown>;
  createdAt: string;
  reason?: string;
}

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();
  private policyEngine: ToolPolicyEngine = new ToolPolicyEngine();
  private pendingApprovals: Map<string, PendingToolApproval> = new Map();

  public register<TInput, TOutput>(
    definition: ToolDefinition,
    handler: ToolHandler<TInput, TOutput>
  ): void {
    this.tools.set(definition.name, { definition, handler });
  }

  public get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  public listTools(namespace?: ToolNamespace): ToolDefinition[] {
    const list: ToolDefinition[] = [];
    for (const tool of this.tools.values()) {
      if (!namespace || tool.definition.namespace === namespace) {
        list.push(tool.definition);
      }
    }
    return list;
  }

  public getPendingApproval(callId: string): PendingToolApproval | undefined {
    return this.pendingApprovals.get(callId);
  }

  public listPendingApprovals(runId?: string): PendingToolApproval[] {
    const all = Array.from(this.pendingApprovals.values());
    return runId ? all.filter((p) => p.runId === runId) : all;
  }

  /** Restore a pending approval (e.g. from DB / state_snapshot) so approveAndExecute can run. */
  public restorePendingApproval(pending: PendingToolApproval): void {
    this.pendingApprovals.set(pending.callId, pending);
  }

  /**
   * Human denied a pending tool call. Does not invent success.
   */
  public denyPending(callId: string, reason = 'Denied by human reviewer'): {
    result: ToolResult;
    record: ToolCall;
  } {
    const pending = this.pendingApprovals.get(callId);
    if (!pending) {
      return {
        result: { success: false, error: `No pending approval for callId "${callId}"` },
        record: {
          id: callId,
          runId: 'unknown',
          toolName: 'unknown',
          namespace: 'unknown',
          status: ToolStatus.FAILED,
          riskLevel: 'unknown',
          sanitizedInput: {},
          error: `No pending approval for callId "${callId}"`,
          timestamp: new Date().toISOString(),
          durationMs: 0,
        },
      };
    }

    this.pendingApprovals.delete(callId);
    const record: ToolCall = {
      id: callId,
      runId: pending.runId,
      toolName: pending.toolName,
      namespace: pending.namespace,
      status: ToolStatus.DENIED,
      riskLevel: pending.riskLevel,
      sanitizedInput: pending.sanitizedInput,
      error: reason,
      timestamp: new Date().toISOString(),
      durationMs: 0,
    };
    return {
      result: { success: false, error: reason, errorClass: 'DENIED' },
      record,
    };
  }

  /**
   * Complete a pending approval by re-executing with forceApprove.
   */
  public async approveAndExecute(
    callId: string,
    approvedBy?: string,
  ): Promise<{ result: ToolResult; record: ToolCall }> {
    const pending = this.pendingApprovals.get(callId);
    if (!pending) {
      return {
        result: { success: false, error: `No pending approval for callId "${callId}"` },
        record: {
          id: callId,
          runId: 'unknown',
          toolName: 'unknown',
          namespace: 'unknown',
          status: ToolStatus.FAILED,
          riskLevel: 'unknown',
          sanitizedInput: {},
          error: `No pending approval for callId "${callId}"`,
          timestamp: new Date().toISOString(),
          durationMs: 0,
        },
      };
    }

    this.pendingApprovals.delete(callId);
    const { result, record } = await this.execute(pending.toolName, pending.input, {
      runId: pending.runId,
      projectId: pending.projectId,
      forceApprove: true,
    });

    if (approvedBy && result.success) {
      record.sanitizedOutput = {
        ...(typeof record.sanitizedOutput === 'object' && record.sanitizedOutput
          ? (record.sanitizedOutput as Record<string, unknown>)
          : {}),
        approvedBy,
      };
    }

    return { result, record };
  }

  /**
   * Executes a registered tool securely with:
   * - Policy evaluation
   * - Timeout enforcement
   * - Execution metric tracking
   * - Sanitized inputs/outputs for audit logs
   */
  public async execute(
    toolName: string,
    rawInput: Record<string, unknown>,
    context: PolicyEvaluationContext
  ): Promise<{ result: ToolResult; record: ToolCall }> {
    const tool = this.tools.get(toolName);
    const timestamp = new Date().toISOString();
    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!tool) {
      const record: ToolCall = {
        id: callId,
        runId: context.runId,
        toolName,
        namespace: 'unknown',
        status: ToolStatus.FAILED,
        riskLevel: 'unknown',
        sanitizedInput: sanitizeValue(rawInput) as Record<string, unknown>,
        error: `Tool "${toolName}" is not registered`,
        timestamp,
        durationMs: 0,
      };
      return {
        result: { success: false, error: record.error },
        record,
      };
    }

    // 1. Policy check
    const policyResult = this.policyEngine.evaluate(tool.definition, context);
    if (!policyResult.allowed) {
      const record: ToolCall = {
        id: callId,
        runId: context.runId,
        toolName,
        namespace: tool.definition.namespace,
        status: ToolStatus.DENIED,
        riskLevel: tool.definition.riskLevel,
        sanitizedInput: sanitizeValue(rawInput) as Record<string, unknown>,
        error: policyResult.reason,
        timestamp,
        durationMs: 0,
      };
      return {
        result: { success: false, error: policyResult.reason },
        record,
      };
    }

    // 2. Check if human approval is required
    if (policyResult.requiresHumanApproval) {
      const sanitizedInput = sanitizeValue(rawInput) as Record<string, unknown>;
      const pending: PendingToolApproval = {
        callId,
        toolName,
        namespace: tool.definition.namespace,
        riskLevel: tool.definition.riskLevel,
        runId: context.runId,
        projectId: context.projectId,
        input: rawInput,
        sanitizedInput,
        createdAt: timestamp,
        reason: policyResult.reason,
      };
      this.pendingApprovals.set(callId, pending);

      const record: ToolCall = {
        id: callId,
        runId: context.runId,
        toolName,
        namespace: tool.definition.namespace,
        status: ToolStatus.PENDING,
        riskLevel: tool.definition.riskLevel,
        sanitizedInput,
        timestamp,
        durationMs: 0,
      };
      return {
        result: {
          success: false,
          error: 'ACTION_REQUIRED: Tool execution requires human approval before proceeding',
          errorClass: 'APPROVAL_REQUIRED',
          data: { callId, toolName },
        },
        record,
      };
    }

    // 3. Execute with timeout
    const startTime = Date.now();
    const timeoutMs = tool.definition.timeoutMs || 30000;

    try {
      const executionPromise = tool.handler(rawInput, {
        runId: context.runId,
        projectId: context.projectId,
      });

      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          const timeoutErr = new Error(`Tool execution timed out after ${timeoutMs}ms`);
          (timeoutErr as any).isTimeout = true;
          reject(timeoutErr);
        }, timeoutMs);
      });

      const output = await Promise.race([executionPromise, timeoutPromise]);
      if (timeoutHandle) clearTimeout(timeoutHandle);
      const durationMs = Date.now() - startTime;

      const record: ToolCall = {
        id: callId,
        runId: context.runId,
        toolName,
        namespace: tool.definition.namespace,
        status: ToolStatus.SUCCESS,
        riskLevel: tool.definition.riskLevel,
        sanitizedInput: sanitizeValue(rawInput) as Record<string, unknown>,
        sanitizedOutput: sanitizeValue(output) as Record<string, unknown>,
        durationMs,
        timestamp,
      };

      return {
        result: { success: true, data: output },
        record,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const isTimeout = Boolean(err?.isTimeout);
      const record: ToolCall = {
        id: callId,
        runId: context.runId,
        toolName,
        namespace: tool.definition.namespace,
        status: isTimeout ? ToolStatus.TIMEOUT : ToolStatus.FAILED,
        riskLevel: tool.definition.riskLevel,
        sanitizedInput: sanitizeValue(rawInput) as Record<string, unknown>,
        error: err?.message || 'Tool execution failed',
        durationMs,
        timestamp,
      };

      return {
        result: { success: false, error: err?.message || 'Tool execution failed' },
        record,
      };
    }
  }
}

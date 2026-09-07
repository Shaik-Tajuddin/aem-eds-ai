// ============================================================
// @aeds/tools — Policy Engine
// Evaluates tool invocation permissions and human approval gates
// ============================================================

import type { ToolDefinition } from '@aeds/shared';

export interface PolicyEvaluationContext {
  projectId: string;
  runId: string;
  userRole?: 'admin' | 'developer' | 'viewer';
  /** Trusted agent pipeline may auto-approve high-risk (non-critical) tools. */
  autoApproveHighRisk?: boolean;
  autoApproveMediumRisk?: boolean;
  /** Human already approved this specific invocation (completion path). */
  forceApprove?: boolean;
}

export interface PolicyResult {
  allowed: boolean;
  requiresHumanApproval: boolean;
  reason?: string;
}

export class ToolPolicyEngine {
  public evaluate(tool: ToolDefinition, context: PolicyEvaluationContext): PolicyResult {
    // 1. Check Scope
    const isAllowedScope =
      tool.allowedInScopes.includes('*') ||
      tool.allowedInScopes.includes(context.projectId);

    if (!isAllowedScope) {
      return {
        allowed: false,
        requiresHumanApproval: false,
        reason: `Tool "${tool.name}" is not permitted in project scope "${context.projectId}"`,
      };
    }

    // Already human-approved invocations skip the gate (completion API).
    if (context.forceApprove) {
      return { allowed: true, requiresHumanApproval: false };
    }

    // 2. Explicit approval flag or critical risk always requires human approval
    if (tool.riskLevel === 'critical' || tool.requiresApproval) {
      return {
        allowed: true,
        requiresHumanApproval: true,
        reason: `Tool "${tool.name}" has critical risk or requires human approval`,
      };
    }

    // 3. High risk requires confirmation unless the trusted agent pipeline opts in
    if (tool.riskLevel === 'high' && !context.autoApproveHighRisk) {
      return {
        allowed: true,
        requiresHumanApproval: true,
        reason: `Tool "${tool.name}" has high risk level and requires confirmation`,
      };
    }

    // 4. Low / medium / auto-approved high risk
    return {
      allowed: true,
      requiresHumanApproval: false,
    };
  }
}

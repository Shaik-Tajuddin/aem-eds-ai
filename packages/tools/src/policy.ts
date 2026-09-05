// ============================================================
// @aeds/tools — Policy Engine
// Evaluates tool invocation permissions and human approval gates
// ============================================================

import type { ToolDefinition } from '@aeds/shared';

export interface PolicyEvaluationContext {
  projectId: string;
  runId: string;
  userRole?: 'admin' | 'developer' | 'viewer';
  autoApproveMediumRisk?: boolean;
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

    // 2. Critical risk always requires human approval or admin role
    if (tool.riskLevel === 'critical' || tool.requiresApproval) {
      return {
        allowed: true,
        requiresHumanApproval: true,
        reason: `Tool "${tool.name}" has critical risk or requires human approval`,
      };
    }

    // 3. High risk requires approval unless explicitly auto-approved
    if (tool.riskLevel === 'high') {
      return {
        allowed: true,
        requiresHumanApproval: true,
        reason: `Tool "${tool.name}" has high risk level and requires confirmation`,
      };
    }

    // 4. Low and medium risk
    return {
      allowed: true,
      requiresHumanApproval: false,
    };
  }
}

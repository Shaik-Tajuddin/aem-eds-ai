// ============================================================
// @aeds/agent — Build Validation Agent
// Produces SYSTEM EVIDENCE for BUILDING — never fake success
// ============================================================

import { RunStatus, type SystemEvidence } from '@aeds/shared';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';
import { executeTool } from '../execute-tool.js';
import { validateEdsArtifacts } from '../validate-artifacts.js';

function makeEvidence(
  kind: SystemEvidence['kind'],
  status: SystemEvidence['status'],
  summary: string,
  mode: SystemEvidence['mode'],
  metrics?: Record<string, number | string | boolean>,
): SystemEvidence {
  return {
    id: `ev_${kind}_${Date.now()}`,
    kind,
    status,
    summary,
    metrics,
    producedAt: new Date().toISOString(),
    mode,
  };
}

export class BuildValidationAgent extends BaseAgent {
  public readonly id = 'agent-build';
  public readonly name = 'Build Validator';
  public readonly description = 'Validates generated EDS artifacts before deploy/test';
  public readonly phase = RunStatus.BUILDING;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log('Running build validation against generated files...');
    context.evidence = context.evidence || [];

    const files = Array.from(context.generatedFiles.values()).map((f) => ({
      path: f.path,
      content: f.content,
    }));

    let result = validateEdsArtifacts(files);

    // Prefer tool registry path outside unit tests (audited execution)
    if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
      const toolResult = await executeTool(context, 'build.validateArtifacts', { files });
      if (toolResult.success && toolResult.data) {
        result = toolResult.data as typeof result;
      } else if (!toolResult.success) {
        context.log(
          `build.validateArtifacts tool failed (${toolResult.error}); using local validator result`,
          'warn',
        );
      }
    }

    const status = result.passed ? 'PASS' : 'FAIL';
    const evidence = makeEvidence(
      'build',
      status,
      result.summary,
      'static',
      {
        fileCount: result.fileCount,
        blockJsCount: result.blockJsCount,
        errorCount: result.errorCount,
      },
    );
    context.evidence.push(evidence);
    context.emit('build.completed', { evidence });

    if (!result.passed) {
      for (const err of result.errors) {
        context.bugs.push({
          id: `bug_build_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: 'Build validation failure',
          severity: 'CRITICAL',
          description: err,
        });
      }
      return {
        success: false,
        decision: this.createDecision(context, 'Validate build artifacts', result.errors, evidence.summary),
        error: evidence.summary,
      };
    }

    return {
      success: true,
      decision: this.createDecision(
        context,
        'Validate build artifacts',
        ['Check decorate exports', 'Reject forbidden deps', 'Parse JSON configs', 'Via build.validateArtifacts tool'],
        evidence.summary,
      ),
    };
  }
}

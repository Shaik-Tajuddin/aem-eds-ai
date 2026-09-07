// ============================================================
// @aeds/agent — Build Validation Agent
// Produces SYSTEM EVIDENCE for BUILDING — never fake success
// ============================================================

import { RunStatus, type SystemEvidence } from '@aeds/shared';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';

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

    const files = Array.from(context.generatedFiles.values());
    const jsBlocks = files.filter((f) => f.path.startsWith('blocks/') && f.path.endsWith('.js'));
    const errors: string[] = [];

    if (files.length === 0) {
      errors.push('No generated files to build');
    }

    for (const file of jsBlocks) {
      if (!file.content.includes('export default function decorate')) {
        errors.push(`${file.path}: missing export default function decorate`);
      }
      if (/from\s+['"]react['"]|require\(['"]react['"]\)/.test(file.content)) {
        errors.push(`${file.path}: forbidden React dependency in EDS block`);
      }
    }

    for (const file of files.filter((f) => f.path.endsWith('.json'))) {
      try {
        JSON.parse(file.content);
      } catch {
        errors.push(`${file.path}: invalid JSON`);
      }
    }

    const status = errors.length === 0 ? 'PASS' : 'FAIL';
    const evidence = makeEvidence(
      'build',
      status,
      errors.length === 0
        ? `Build validation passed for ${files.length} file(s), ${jsBlocks.length} block JS`
        : `Build validation failed: ${errors.join('; ')}`,
      'static',
      { fileCount: files.length, blockJsCount: jsBlocks.length, errorCount: errors.length },
    );
    context.evidence.push(evidence);
    context.emit('build.completed', { evidence });

    if (errors.length > 0) {
      for (const err of errors) {
        context.bugs.push({
          id: `bug_build_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: 'Build validation failure',
          severity: 'CRITICAL',
          description: err,
        });
      }
      return {
        success: false,
        decision: this.createDecision(context, 'Validate build artifacts', errors, evidence.summary),
        error: evidence.summary,
      };
    }

    return {
      success: true,
      decision: this.createDecision(
        context,
        'Validate build artifacts',
        ['Check decorate exports', 'Reject forbidden deps', 'Parse JSON configs'],
        evidence.summary,
      ),
    };
  }
}

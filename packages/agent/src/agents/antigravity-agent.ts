// ============================================================
// @aeds/agent — Antigravity Developer Agent
// Planning facade that synthesizes blocks from detected candidates
// (delegates to EdsDeveloperAgent — never hardcodes a single block)
// ============================================================

import { RunStatus, AgentEventType } from '@aeds/shared';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';
import { EdsDeveloperAgent } from './eds-developer.js';

export interface AntigravityBlockDefinition {
  name: string;
  js: string;
  css: string;
}

/**
 * Antigravity mode keeps the multi-step planning telemetry, but block
 * synthesis always follows `context.detectedBlocks` via EdsDeveloperAgent
 * (LLM when available, otherwise typed fallbacks including accordion).
 */
export class AntigravityDeveloperAgent extends BaseAgent {
  public readonly id = 'antigravity-developer-agent';
  public readonly name = 'AntigravityDeveloperAgent';
  public readonly description =
    'Autonomous developer agent: plans then synthesizes EDS blocks from detected candidates';
  public readonly phase = RunStatus.IMPLEMENTING;

  private readonly developer = new EdsDeveloperAgent();

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log('Antigravity Developer Agent initializing autonomous planning...');
    context.emit(AgentEventType.AGENT_STEP_STARTED, {
      agent: this.name,
      thought:
        'Analyzing reference source and detected block candidates to construct visual parity plan...',
    });

    const blocks = (context.detectedBlocks || []).filter(
      (b) =>
        !['header', 'footer', 'page-metadata', 'metadata', 'nav', 'navigation'].includes(b),
    );
    const targetLabel = blocks.length > 0 ? blocks.join(', ') : 'hero, columns, cards (defaults)';

    const intent =
      'Implement complete visual parity, block decoration, and authoring alignment matching reference page.';
    const plan = [
      'Extract layout, typography, and component hierarchy from reference snapshot',
      `Synthesize EDS blocks for detected candidates: ${targetLabel}`,
      'Preserve Universal Editor instrumentation attributes (data-aue-*) for in-context authoring',
      'Generate scoped CSS and decorate() JS per block (LLM when available, typed fallbacks otherwise)',
      'Publish generated files to work branch and trigger downstream validation',
    ];
    const rationale =
      'Candidate-driven synthesis ensures new blocks (e.g. accordion) are generated instead of a fixed template.';

    const decision = this.createDecision(context, intent, plan, rationale);

    context.emit(AgentEventType.AGENT_STEP_STARTED, {
      agent: this.name,
      decision,
    });

    const result = await this.developer.execute(context);

    context.log(
      `Antigravity Developer Agent generated ${(result.filesGenerated || []).length} file(s) for: ${targetLabel}.`,
    );

    context.emit(AgentEventType.AGENT_STEP_COMPLETED, {
      agent: this.name,
      thought:
        'Blocks synthesized from detected candidates. Prepared for downstream build validation and live browser verification.',
    });

    return {
      success: result.success,
      decision,
      filesGenerated: result.filesGenerated,
      error: result.error,
    };
  }
}

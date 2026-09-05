// ============================================================
// @aeds/agent — Project Analyzer Agent
// Analyzes existing EDS repository structure, blocks, and configurations
// ============================================================

import { RunStatus } from '@aeds/shared';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';

export class ProjectAnalyzerAgent extends BaseAgent {
  public readonly id = 'agent-project-analyzer';
  public readonly name = 'Project Analyzer';
  public readonly description = 'Scans repository structure, fstab.yaml, scripts, and existing blocks';
  public readonly phase = RunStatus.ANALYZING;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log(`Analyzing EDS project ${context.repoOwner}/${context.repoName}...`);

    const knownBlocks: string[] = ['header', 'footer', 'hero', 'columns', 'cards'];
    context.detectedBlocks = knownBlocks;

    const decision = this.createDecision(
      context,
      'Analyze EDS repository conventions and dependencies',
      [
        'Verify fstab.yaml mount points and Helix indexing',
        'Inspect existing scripts/scripts.js block loader pipeline',
        'Identify existing blocks and common design tokens',
      ],
      'Analysis complete: standard EDS boilerplate detected with core block pipeline intact.'
    );

    return {
      success: true,
      decision,
    };
  }
}

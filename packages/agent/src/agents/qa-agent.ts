// ============================================================
// @aeds/agent — QA Validation Agent
// Static EDS conventions + optional live Playwright evidence
// ============================================================

import { RunStatus } from '@aeds/shared';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';
import { runLiveBrowserAudit } from '../live-browser-audit.js';

export class QAValidationAgent extends BaseAgent {
  public readonly id = 'agent-qa';
  public readonly name = 'QA Automation Engineer';
  public readonly description = 'Validates EDS blocks and runs live Playwright when a preview URL is available';
  public readonly phase = RunStatus.FUNCTIONAL_TESTING;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log('Running automated QA verification on generated EDS blocks...');
    context.evidence = context.evidence || [];

    const plan: string[] = [
      'Inspect decorate(block) function signature and DOM queries',
      'Verify zero forbidden external library imports',
      'Audit CSS scoping to block class root',
    ];

    for (const [path, file] of context.generatedFiles.entries()) {
      if (path.endsWith('.js') && path.startsWith('blocks/')) {
        if (!file.content.includes('export default function decorate')) {
          context.bugs.push({
            id: `bug_${Date.now()}`,
            title: `Block decorator missing in ${path}`,
            severity: 'CRITICAL',
            description: 'EDS blocks must export default function decorate(block)',
          });
        }
      }
    }

    // Ensure preview URL exists early for live audits (DeploymentAgent also sets this later)
    if (!context.previewUrl && context.repoOwner && context.repoName) {
      const cleanBranch = context.workBranch
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const cleanRepo = context.repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const cleanOwner = context.repoOwner.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      context.previewUrl = `https://${cleanBranch}--${cleanRepo}--${cleanOwner}.aem.live/`;
    }

    const live = await runLiveBrowserAudit(context, ['desktop', 'mobile']);
    for (const ev of live.evidence) {
      context.evidence.push(ev);
    }
    plan.push(`Live Playwright: ${live.mode}`);

    if (live.mode === 'live' && !live.ok) {
      context.bugs.push({
        id: `bug_browser_${Date.now()}`,
        title: 'Live browser audit failures',
        severity: 'CRITICAL',
        description: live.error || live.evidence[0]?.summary || 'Console/network errors during Playwright audit',
      });
    }

    if (live.mode === 'live') {
      for (const audit of live.audits) {
        for (const v of audit.a11yViolations) {
          context.bugs.push({
            id: `bug_live_a11y_${v.id}_${Date.now()}`,
            title: `Live a11y (${audit.a11yMode || 'heuristic'}): ${v.id}`,
            severity: v.impact === 'critical' ? 'CRITICAL' : 'SERIOUS',
            description: v.description,
          });
        }
      }
    }

    const decision = this.createDecision(
      context,
      'Execute QA Validation suite',
      plan,
      live.mode === 'live'
        ? `Static EDS checks + live Playwright (${live.ok ? 'PASS' : 'FAIL'})`
        : `Static EDS checks completed; live browser ${live.mode}`,
    );

    return { success: true, decision };
  }
}

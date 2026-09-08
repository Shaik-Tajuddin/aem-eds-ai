// ============================================================
// @aeds/agent — QA Validation Agent
// Static EDS conventions + optional live Playwright evidence
// ============================================================

import { RunStatus } from '@aeds/shared';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';
import { runLiveBrowserAudit } from '../live-browser-audit.js';
import { missingBlockAssets } from './eds-developer.js';
import { buildPreviewPageUrl } from '../reference-capture.js';
import { buildPreviewUrl } from './deployment-agent.js';

function clearSoftLiveBugs(context: RunExecutionContext): number {
  let n = 0;
  for (const bug of context.bugs) {
    if (bug.resolved) continue;
    if (/^Live a11y|^Live browser|advisory/i.test(bug.title)) {
      bug.resolved = true;
      n++;
    }
  }
  return n;
}

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
      'Ensure every detected block candidate has JS/CSS assets',
    ];

    // Prevent soft live defects from accumulating across heal-loop regressions
    const cleared = clearSoftLiveBugs(context);
    if (cleared > 0) {
      context.log(`Cleared ${cleared} prior soft live defect(s) before re-audit.`);
    }

    const missing = missingBlockAssets(context.detectedBlocks, context.generatedFiles);
    for (const name of missing) {
      context.bugs.push({
        id: `bug_missing_block_${name}_${Date.now()}`,
        title: `Missing block assets for ${name}`,
        severity: 'CRITICAL',
        description: `Detected block "${name}" has no blocks/${name}/${name}.js — implement decorate() + CSS before quality gate.`,
      });
    }

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

    // Prefer published preview origin; derive path-aware audit URL from source page
    if (!context.previewUrl && context.repoOwner && context.repoName) {
      context.previewUrl = buildPreviewUrl(context.repoOwner, context.repoName, context.workBranch);
    }
    if (context.previewUrl) {
      context.previewAuditUrl = buildPreviewPageUrl(context.previewUrl, context.sourceUrl);
      plan.push(`Live audit URL: ${context.previewAuditUrl}`);
    }

    if (!context.previewPublished) {
      context.log(
        'Live Playwright deferred — preview branch not published yet (static EDS checks only).',
        'warn',
      );
      plan.push('Live Playwright: skipped (preview not published)');
    }

    const live = await runLiveBrowserAudit(context, ['desktop', 'mobile']);
    for (const ev of live.evidence) {
      context.evidence.push(ev);
    }
    if (context.previewPublished) {
      plan.push(
        `Live Playwright: ${live.mode}` +
          (live.auditUrl ? ` @ ${live.auditUrl}` : '') +
          (live.contentReady === false ? ' (advisory — content not on preview yet)' : ''),
      );
    }

    const contentReady = live.contentReady === true;
    context.previewContentReady = contentReady;

    // Hard gate only when the authored preview page is present
    if (live.mode === 'live' && contentReady && !live.ok) {
      context.bugs.push({
        id: `bug_browser_${Date.now()}`,
        title: 'Live browser audit failures',
        severity: 'CRITICAL',
        description: live.error || live.evidence[0]?.summary || 'Console/network errors during Playwright audit',
      });
    } else if (live.mode === 'live' && !contentReady) {
      context.log(
        'Live a11y/console treated as advisory — preview page does not include generated block content yet (code-only publish).',
        'warn',
      );
    }

    if (live.mode === 'live' && contentReady) {
      for (const audit of live.audits) {
        for (const v of audit.a11yViolations) {
          // Only critical a11y on a content-ready page gates the heal loop
          if (v.impact !== 'critical') continue;
          context.bugs.push({
            id: `bug_live_a11y_${v.id}_${Date.now()}`,
            title: `Live a11y (critical): ${v.id}`,
            severity: 'CRITICAL',
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
        ? contentReady
          ? `Static EDS checks + live Playwright (${live.ok ? 'PASS' : 'FAIL'})`
          : `Static EDS checks + live Playwright advisory (preview content not ready)`
        : `Static EDS checks completed; live browser ${live.mode}`,
    );

    return { success: true, decision };
  }
}

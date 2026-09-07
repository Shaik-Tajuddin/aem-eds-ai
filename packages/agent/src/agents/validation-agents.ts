// ============================================================
// @aeds/agent — Visual / Accessibility / Performance / Quality Gate
// Evidence-backed stages (static when live tools unavailable)
// ============================================================

import { RunStatus, type SystemEvidence } from '@aeds/shared';
import { auditHtmlStatic } from '@aeds/accessibility';
import { auditAssetBudgets } from '@aeds/performance';
import { VisualComparator } from '@aeds/visual';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';

function evidence(
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

function pushEvidence(context: RunExecutionContext, ev: SystemEvidence): void {
  context.evidence = context.evidence || [];
  context.evidence.push(ev);
}

async function fetchPngBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ctype = res.headers.get('content-type') || '';
    if (!ctype.includes('png') && !ctype.includes('octet-stream') && !ctype.includes('image')) {
      // Still try — some CDNs omit content-type
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

export class VisualValidationAgent extends BaseAgent {
  public readonly id = 'agent-visual';
  public readonly name = 'Visual Validation Agent';
  public readonly description = 'Compares screenshots via pixelmatch when available; otherwise SKIPPED';
  public readonly phase = RunStatus.VISUAL_VALIDATION;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log('Visual validation stage...');

    const threshold = Number(process.env.QG_VISUAL_THRESHOLD || 95);
    const screenshots = context.browserScreenshots || {};
    const candidateB64 = screenshots.desktop || Object.values(screenshots)[0];

    // Baseline: explicit URL, or reference capture is not a PNG — require VISUAL_BASELINE_URL / ENABLE_LIVE_VISUAL with pair
    const baselineUrl = process.env.VISUAL_BASELINE_URL || context.visualBaselineUrl;
    const liveFlag = process.env.ENABLE_LIVE_VISUAL === 'true';

    if (!candidateB64) {
      const ev = evidence(
        'visual',
        'SKIPPED',
        'Visual comparison SKIPPED — no implementation screenshot in context (run live Playwright first). Not claimed as PASS.',
        'unavailable',
      );
      pushEvidence(context, ev);
      return {
        success: true,
        decision: this.createDecision(
          context,
          'Visual validation',
          ['Need Playwright screenshot + baseline PNG'],
          ev.summary,
        ),
      };
    }

    if (!baselineUrl && !liveFlag) {
      const ev = evidence(
        'visual',
        'SKIPPED',
        'Visual comparison SKIPPED — set VISUAL_BASELINE_URL or ENABLE_LIVE_VISUAL=true with baseline. Candidate screenshot captured but not compared.',
        'unavailable',
        { hasCandidate: true },
      );
      pushEvidence(context, ev);
      return {
        success: true,
        decision: this.createDecision(context, 'Visual validation', ['Candidate present', 'Baseline missing'], ev.summary),
      };
    }

    if (!baselineUrl) {
      const ev = evidence(
        'visual',
        'UNAVAILABLE',
        'ENABLE_LIVE_VISUAL=true but VISUAL_BASELINE_URL / visualBaselineUrl not set — cannot compare',
        'unavailable',
      );
      pushEvidence(context, ev);
      context.bugs.push({
        id: `bug_visual_${Date.now()}`,
        title: 'Visual baseline missing',
        severity: 'SERIOUS',
        description: ev.summary,
      });
      return {
        success: true,
        decision: this.createDecision(context, 'Visual validation', [], ev.summary),
      };
    }

    const baselineBuf = await fetchPngBuffer(baselineUrl);
    if (!baselineBuf) {
      const ev = evidence(
        'visual',
        'UNAVAILABLE',
        `Failed to fetch baseline PNG from ${baselineUrl}`,
        'unavailable',
      );
      pushEvidence(context, ev);
      context.bugs.push({
        id: `bug_visual_${Date.now()}`,
        title: 'Visual baseline fetch failed',
        severity: 'SERIOUS',
        description: ev.summary,
      });
      return { success: true, decision: this.createDecision(context, 'Visual validation', [], ev.summary) };
    }

    const candidateBuf = Buffer.from(candidateB64, 'base64');
    const comparator = new VisualComparator();
    const result = await comparator.compare(baselineBuf, candidateBuf, {
      threshold,
      generateDiffImage: true,
    });

    const status = result.passed ? 'PASS' : 'FAIL';
    const ev = evidence(
      'visual',
      status,
      `Visual score ${result.score}% (threshold ${threshold}%) — ${status}`,
      'live',
      {
        score: result.score,
        threshold,
        diffPixels: result.diffPixels,
        diffPercentage: result.diffPercentage,
      },
    );
    pushEvidence(context, ev);
    context.emit('visual.completed', { evidence: ev, score: result.score });

    if (!result.passed) {
      context.bugs.push({
        id: `bug_visual_${Date.now()}`,
        title: `Visual mismatch score ${result.score}%`,
        severity: 'SERIOUS',
        description: `Below threshold ${threshold}%; diffPixels=${result.diffPixels}`,
      });
    }

    return {
      success: true,
      decision: this.createDecision(
        context,
        'Visual validation',
        [`pixelmatch score=${result.score}`, `threshold=${threshold}`],
        ev.summary,
      ),
    };
  }
}

export class AccessibilityAgent extends BaseAgent {
  public readonly id = 'agent-a11y';
  public readonly name = 'Accessibility Agent';
  public readonly description = 'Static HTML a11y + live axe evidence from Playwright when available';
  public readonly phase = RunStatus.ACCESSIBILITY;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log('Accessibility validation...');

    // Prefer live axe results already collected by QA/browser audit
    const live = context.liveBrowserAudit;
    if (live && Object.keys(live).length > 0) {
      const entries = Object.entries(live);
      const total = entries.reduce((n, [, v]) => n + v.a11yViolations, 0);
      const mode = entries.some(([, v]) => v.a11yMode === 'axe') ? 'axe' : 'heuristic';
      const status = total === 0 ? 'PASS' : 'FAIL';
      const ev = evidence(
        'accessibility',
        status,
        `Live accessibility (${mode}): ${total} violation(s) across ${entries.length} viewport(s)`,
        'live',
        { violationCount: total, a11yMode: mode },
      );
      pushEvidence(context, ev);
      return {
        success: true,
        decision: this.createDecision(
          context,
          'Accessibility audit',
          [`Live ${mode} evidence from Playwright`],
          ev.summary,
        ),
      };
    }

    const htmlParts: string[] = [];
    if (context.architectureIR?.components?.length) {
      for (const c of context.architectureIR.components) {
        htmlParts.push(c.rendering.semanticHtml);
      }
    }
    for (const f of context.generatedFiles.values()) {
      if (f.path.endsWith('.html')) htmlParts.push(f.content);
    }

    const html = htmlParts.join('\n') || '<section><h1>Content</h1></section>';
    const result = auditHtmlStatic(html);
    const status = result.passed ? 'PASS' : 'FAIL';
    const ev = evidence('accessibility', status, `${result.summary} (mode=${result.mode})`, 'static', {
      violationCount: result.violations.length,
    });
    pushEvidence(context, ev);

    if (!result.passed) {
      for (const v of result.violations) {
        context.bugs.push({
          id: `bug_a11y_${v.id}_${Date.now()}`,
          title: `A11y: ${v.id}`,
          severity: v.impact === 'critical' ? 'CRITICAL' : 'SERIOUS',
          description: v.description,
        });
      }
    }

    return {
      success: true,
      decision: this.createDecision(
        context,
        'Accessibility audit',
        result.violations.map((v) => v.description).concat(['Static HTML heuristics']),
        ev.summary,
      ),
    };
  }
}

export class PerformanceAgent extends BaseAgent {
  public readonly id = 'agent-perf';
  public readonly name = 'Performance Agent';
  public readonly description = 'Static asset budgets + live LCP from Playwright when available';
  public readonly phase = RunStatus.PERFORMANCE;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log('Performance validation...');
    const assets = Array.from(context.generatedFiles.values()).map((f) => ({
      path: f.path,
      content: f.content,
    }));
    const budget = auditAssetBudgets(assets);
    const maxLcp = Number(process.env.QG_MAX_LCP_MS || 2500);

    let liveLcp: number | undefined;
    if (context.liveBrowserAudit) {
      for (const v of Object.values(context.liveBrowserAudit)) {
        if (typeof v.lcp === 'number') {
          liveLcp = liveLcp === undefined ? v.lcp : Math.max(liveLcp, v.lcp);
        }
      }
    }

    // Optional live Lighthouse — never fabricate; unavailable when not installed/enabled
    let lighthouseSummary: string | undefined;
    if (process.env.ENABLE_LIGHTHOUSE === 'true' && (context.previewUrl || context.sourceUrl)) {
      try {
        const { runLighthouseAudit } = await import('@aeds/performance');
        const lh = await runLighthouseAudit({
          url: (context.previewUrl || context.sourceUrl)!,
          formFactor: 'mobile',
        });
        lighthouseSummary = lh.summary;
        pushEvidence(
          context,
          evidence(
            'performance',
            lh.mode === 'lighthouse' ? (lh.passed ? 'PASS' : 'FAIL') : 'UNAVAILABLE',
            lh.summary,
            lh.mode === 'lighthouse' ? 'live' : 'unavailable',
            lh.metrics,
          ),
        );
        if (lh.mode === 'lighthouse' && !lh.passed) {
          context.bugs.push({
            id: `bug_lighthouse_${Date.now()}`,
            title: 'Lighthouse performance failure',
            severity: 'MODERATE',
            description: lh.summary,
          });
        }
      } catch (err: unknown) {
        lighthouseSummary = err instanceof Error ? err.message : String(err);
      }
    }

    const liveFail = typeof liveLcp === 'number' && liveLcp > maxLcp;
    const passed = budget.passed && !liveFail;
    const status = passed ? 'PASS' : 'FAIL';
    const summaryParts = [budget.summary];
    if (typeof liveLcp === 'number') {
      summaryParts.push(`Live LCP=${liveLcp}ms (budget ${maxLcp}ms)`);
    } else {
      summaryParts.push('Live LCP unavailable (static budgets only)');
    }
    if (lighthouseSummary) summaryParts.push(lighthouseSummary);

    const ev = evidence(
      'performance',
      status,
      summaryParts.join(' | '),
      typeof liveLcp === 'number' ? 'live' : 'static',
      { ...budget.metrics, ...(typeof liveLcp === 'number' ? { liveLcp, maxLcp } : {}) },
    );
    pushEvidence(context, ev);

    if (!passed) {
      context.bugs.push({
        id: `bug_perf_${Date.now()}`,
        title: 'Performance budget failure',
        severity: 'MODERATE',
        description: summaryParts.join(' | '),
      });
    }

    return {
      success: true,
      decision: this.createDecision(
        context,
        'Performance budgets',
        budget.actionable.concat(
          typeof liveLcp === 'number' ? [`Live LCP ${liveLcp}ms`] : ['No fabricated Lighthouse scores'],
        ),
        ev.summary,
      ),
    };
  }
}

export class QualityGateAgent extends BaseAgent {
  public readonly id = 'agent-quality-gate';
  public readonly name = 'Quality Gate';
  public readonly description = 'Aggregates system evidence; PASS only when required evidence passes';
  public readonly phase = RunStatus.QUALITY_GATE;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log('Evaluating quality gate from system evidence...');
    const evidenceList = context.evidence || [];
    const failed = evidenceList.filter((e) => e.status === 'FAIL');
    const unresolvedBugs = context.bugs.filter((b) => !b.resolved);

    const hardFail = failed.length > 0 && unresolvedBugs.length === 0;
    const status = failed.length > 0 || unresolvedBugs.length > 0 ? 'FAIL' : 'PASS';
    const summary =
      unresolvedBugs.length > 0
        ? `Quality gate pending repair — ${unresolvedBugs.length} open bug(s); evidence failures=${failed.length}`
        : failed.length > 0
          ? `Quality gate FAIL — evidence failures=${failed.length}`
          : `Quality gate PASS — ${evidenceList.length} evidence record(s); visual may be SKIPPED offline`;

    const ev = evidence(
      'quality-gate',
      status === 'PASS' ? 'PASS' : 'FAIL',
      summary,
      'static',
      {
        evidenceCount: evidenceList.length,
        failedCount: failed.length,
        openBugs: unresolvedBugs.length,
      },
    );
    pushEvidence(context, ev);

    if (hardFail) {
      return {
        success: false,
        decision: this.createDecision(
          context,
          'Quality gate',
          evidenceList.map((e) => `${e.kind}:${e.status}`),
          summary,
        ),
        error: summary,
      };
    }

    return {
      success: true,
      decision: this.createDecision(
        context,
        'Quality gate',
        evidenceList.map((e) => `${e.kind}:${e.status}`),
        summary,
      ),
    };
  }
}

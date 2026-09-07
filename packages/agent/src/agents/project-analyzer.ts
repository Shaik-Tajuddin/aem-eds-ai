// ============================================================
// @aeds/agent — Project Analyzer Agent
// Analyzes reference URL + EDS repository conventions
// ============================================================

import { RunStatus } from '@aeds/shared';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';
import { captureReferencePage } from '../reference-capture.js';

export class ProjectAnalyzerAgent extends BaseAgent {
  public readonly id = 'agent-project-analyzer';
  public readonly name = 'Project Analyzer';
  public readonly description = 'Scans reference page + repository structure for EDS blocks';
  public readonly phase = RunStatus.ANALYZING;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log(`Analyzing EDS project ${context.repoOwner}/${context.repoName}...`);

    const fallbackBlocks = ['hero', 'columns', 'cards'];

    if (context.sourceUrl) {
      context.log(`Capturing reference UI/JS from ${context.sourceUrl}...`);
      const snapshot = await captureReferencePage(context.sourceUrl, {
        repoOwner: context.repoOwner,
        repoName: context.repoName,
        workBranch: context.workBranch,
        authorUrl: context.authorUrl,
        aemPageId: context.aemPageId,
      });
      context.referenceSnapshot = snapshot;

      for (const note of snapshot.notes) {
        context.log(note, snapshot.ok ? 'info' : 'warn');
      }

      if (snapshot.contentSource === 'mcp' && snapshot.jcr?.ok) {
        context.log(
          `MCP components loaded (${snapshot.jcr.components.length}) from ${snapshot.jcr.fetchedFrom}`,
        );
      } else if (snapshot.jcr?.ok) {
        context.log(
          `JCR components loaded (${snapshot.jcr.components.length}) from ${snapshot.jcr.fetchedFrom}`,
        );
      }

      if (snapshot.ok) {
        context.log(
          `Reference captured (${snapshot.finalUrl}) — HTML ${snapshot.htmlExcerpt.length}c, CSS ${snapshot.cssExcerpt.length}c, JS ${snapshot.jsExcerpt.length}c` +
            (snapshot.jcr?.ok
              ? `, ${snapshot.contentSource?.toUpperCase() || 'JCR'} ${snapshot.jcr.components.length} nodes`
              : ''),
        );
        context.detectedBlocks =
          snapshot.detectedBlocks.length > 0
            ? snapshot.detectedBlocks
            : fallbackBlocks;
      } else {
        context.log('Reference capture incomplete — falling back to default block set.', 'warn');
        context.detectedBlocks = fallbackBlocks;
      }
    } else {
      context.log('No sourceUrl on run — skipping reference capture.', 'warn');
      context.detectedBlocks = fallbackBlocks;
    }

    // Always keep header/footer out of generation later; analyzer may still note them
    context.detectedBlocks = (context.detectedBlocks || fallbackBlocks).filter(
      (b) =>
        !['header', 'footer', 'page-metadata', 'metadata', 'nav', 'navigation'].includes(b),
    );
    if (context.detectedBlocks.length === 0) {
      context.detectedBlocks = fallbackBlocks;
    }

    const decision = this.createDecision(
      context,
      'Analyze reference page UI/JS and EDS repository conventions',
      [
        context.sourceUrl
          ? `Fetch and parse reference page at ${context.sourceUrl}`
          : 'No reference URL provided',
        'Detect Franklin/EDS block candidates from markup',
        `Target blocks for implementation: ${(context.detectedBlocks || []).join(', ')}`,
      ],
      context.referenceSnapshot?.ok
        ? `Reference UI captured; will generate resembling block JS/CSS for: ${(context.detectedBlocks || []).join(', ')}`
        : `Proceeding with block set ${(context.detectedBlocks || []).join(', ')} without a full reference capture.`,
    );

    return {
      success: true,
      decision,
    };
  }
}

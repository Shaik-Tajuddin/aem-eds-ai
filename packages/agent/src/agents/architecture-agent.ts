// ============================================================
// @aeds/agent — Architecture Agent
// Plans EDS blocks and emits validated EDSArchitectureIR
// ============================================================

import { RunStatus, type EDSArchitectureIR, type EDSComponentIR } from '@aeds/shared';
import { parseEDSArchitectureIR } from '@aeds/schemas';
import { getSkillPromptSection } from '@aeds/agent-skills';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';

function buildComponentIR(name: string): EDSComponentIR {
  return {
    name,
    type: 'block',
    authoring: {
      editable: true,
      fields: [
        { name: 'title', label: 'Title', component: 'text', required: true },
        { name: 'image', label: 'Image', component: 'reference' },
      ],
      options: [],
    },
    rendering: {
      semanticHtml: `<section class="${name}"><h2>${name}</h2><img src="" alt="${name} image"></section>`,
      responsiveBehavior: [
        { breakpoint: 'mobile', behavior: 'stack' },
        { breakpoint: 'desktop', behavior: 'row' },
      ],
    },
    implementation: {
      css: [`blocks/${name}/${name}.css`],
      javascript: [`blocks/${name}/${name}.js`],
    },
    dependencies: [],
    accessibility: {
      requirements: ['semantic section', 'heading', 'image alt text', 'keyboard operable controls'],
    },
    testing: {
      functional: [
        {
          name: `${name}-renders`,
          description: `${name} block renders heading`,
          selector: `.${name}`,
          assertions: ['visible'],
        },
      ],
      visual: [{ name: `${name}-desktop`, viewport: 'desktop', thresholdPercent: 95 }],
    },
  };
}

export class ArchitectureAgent extends BaseAgent {
  public readonly id = 'agent-architecture';
  public readonly name = 'EDS Architect';
  public readonly description = 'Designs block structure and emits validated Engineering IR';
  public readonly phase = RunStatus.PLANNING;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log('Formulating EDS Architecture Blueprint + Engineering IR...');
    context.log(getSkillPromptSection('eds-architecture').split('\n')[0] || 'eds-architecture skill');

    const blocks = context.detectedBlocks || ['hero', 'columns', 'cards'];
    const refOk = Boolean(context.referenceSnapshot?.ok);

    const architecture: EDSArchitectureIR = {
      id: `arch_${context.runId}`,
      projectId: context.projectId,
      createdAt: new Date().toISOString(),
      components: blocks.map(buildComponentIR),
      reuseDecisions: blocks.map((b) => ({
        component: b,
        decision: 'new' as const,
        rationale: refOk
          ? `Mapped from reference capture; prefer project conventions for ${b}`
          : `No reference capture; propose ${b} following EDS defaults`,
      })),
      conventions: [
        'Prefer existing blocks over new',
        'Semantic HTML over wrappers',
        'CSS over JS when possible',
        'Evidence over model assumption',
      ],
    };

    // Validate IR — fail loudly on invalid architecture
    const validated = parseEDSArchitectureIR(architecture);
    context.architectureIR = validated;

    const planSteps = [
      refOk
        ? `Map reference page ${context.referenceSnapshot?.finalUrl} into EDS sections/blocks`
        : 'Deconstruct target page into EDS sections and blocks (no reference capture)',
      `Selected blocks: ${blocks.join(', ')}`,
      `Validated EDSArchitectureIR with ${validated.components.length} component(s)`,
      'Define Universal Editor schema requirements for authoring',
    ];

    const decision = this.createDecision(
      context,
      'Architect EDS blocks and emit Engineering IR',
      planSteps,
      `Architecture IR validated for blocks: ${blocks.join(', ')}.`,
    );

    return {
      success: true,
      decision,
    };
  }
}

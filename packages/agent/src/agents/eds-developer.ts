// ============================================================
// @aeds/agent — EDS Developer Agent
// Generates production-ready EDS JavaScript block decorators and scoped CSS
// ============================================================

import { RunStatus } from '@aeds/shared';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';

export class EdsDeveloperAgent extends BaseAgent {
  public readonly id = 'agent-eds-developer';
  public readonly name = 'EDS Developer';
  public readonly description = 'Generates vanilla JS block decorators and scoped CSS compliant with Franklin standards';
  public readonly phase = RunStatus.IMPLEMENTING;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log('Generating EDS block implementations and styling...');

    const heroJs = `export default function decorate(block) {
  const [pictureRow, textRow] = [...block.children];

  // Optimize picture row
  if (pictureRow) {
    pictureRow.classList.add('hero-image-wrapper');
  }

  // Optimize text row (h1, p, cta)
  if (textRow) {
    textRow.classList.add('hero-content');
    const h1 = textRow.querySelector('h1');
    if (h1) h1.classList.add('hero-title');
    const links = textRow.querySelectorAll('a');
    links.forEach((a) => a.classList.add('button', 'primary'));
  }
}
`;

    const heroCss = `.hero-wrapper {
  padding: 0;
  margin: 0;
  width: 100%;
}

.hero {
  display: grid;
  grid-template-columns: 1fr;
  position: relative;
  overflow: hidden;
  background-color: var(--background-color, #0f1117);
  color: var(--text-color, #ffffff);
}

@media (min-width: 900px) {
  .hero {
    grid-template-columns: 1fr 1fr;
    align-items: center;
    min-height: 600px;
  }
}

.hero .hero-content {
  padding: 40px 24px;
  z-index: 2;
}

.hero .hero-title {
  font-size: 2.5rem;
  line-height: 1.2;
  margin-bottom: 16px;
  font-weight: 700;
}

.hero .hero-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
`;

    context.generatedFiles.set('blocks/hero/hero.js', {
      path: 'blocks/hero/hero.js',
      content: heroJs,
      operation: 'create',
    });

    context.generatedFiles.set('blocks/hero/hero.css', {
      path: 'blocks/hero/hero.css',
      content: heroCss,
      operation: 'create',
    });

    const blockNames = (context.detectedBlocks || ['hero', 'columns', 'cards']).filter(
      (b) => !['header', 'footer'].includes(b) && b !== 'hero',
    );

    for (const block of blockNames) {
      const jsPath = `blocks/${block}/${block}.js`;
      const cssPath = `blocks/${block}/${block}.css`;
      context.generatedFiles.set(jsPath, {
        path: jsPath,
        content: `export default function decorate(block) {\n  block.classList.add('${block}-block');\n  block.dataset.aueType = 'component';\n  block.dataset.aueModel = '${block}';\n}\n`,
        operation: 'create',
      });
      context.generatedFiles.set(cssPath, {
        path: cssPath,
        content: `.${block}-wrapper { width: 100%; }\n.${block} { display: block; }\n`,
        operation: 'create',
      });
    }

    const filesGenerated = Array.from(context.generatedFiles.keys()).filter((p) =>
      p.startsWith('blocks/'),
    );

    const decision = this.createDecision(
      context,
      'Implement EDS blocks and scoped CSS from analyzed page structure',
      [
        'Create blocks/hero/hero.js with standard decorate(block) entrypoint',
        'Create blocks/hero/hero.css with mobile-first grid layout and CSS variables',
        `Generate additional blocks: ${blockNames.join(', ') || 'none'}`,
        'Ensure zero external runtime dependencies',
      ],
      `Generated ${filesGenerated.length} block file(s) for EDS pipeline.`,
    );

    return {
      success: true,
      decision,
      filesGenerated,
    };
  }
}

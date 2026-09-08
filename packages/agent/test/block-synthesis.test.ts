import { describe, it, expect, vi } from 'vitest';
import { RunStatus } from '@aeds/shared';
import {
  EdsDeveloperAgent,
  AntigravityDeveloperAgent,
  FixAgent,
  QAValidationAgent,
  missingBlockAssets,
  implementationBlockNames,
  type RunExecutionContext,
} from '../src/index.js';

function mockContext(overrides: Partial<RunExecutionContext> = {}): RunExecutionContext {
  return {
    runId: 'run-test',
    projectId: 'proj-test',
    repoOwner: 'adobe',
    repoName: 'wknd-eds',
    baseBranch: 'main',
    workBranch: 'ai-faq',
    sourceType: 'EXISTING_AEM_PAGE',
    sourceUrl: 'https://example.com/faqs.html',
    llmGateway: {
      executeChat: vi.fn(),
    } as unknown as RunExecutionContext['llmGateway'],
    toolRegistry: {} as RunExecutionContext['toolRegistry'],
    generatedFiles: new Map(),
    detectedBlocks: ['accordion'],
    bugs: [],
    evidence: [],
    skipGitHubPublish: true,
    log: vi.fn(),
    emit: vi.fn(),
    ...overrides,
  };
}

describe('candidate-driven block synthesis', () => {
  it('implementationBlockNames keeps accordion and drops chrome', () => {
    expect(implementationBlockNames(['accordion', 'header', 'footer'])).toEqual(['accordion']);
  });

  it('missingBlockAssets reports accordion when JS is absent', () => {
    const files = new Map([['blocks/cards/cards.js', { path: 'blocks/cards/cards.js' }]]);
    expect(missingBlockAssets(['accordion', 'cards'], files)).toEqual(['accordion']);
  });

  it('EdsDeveloperAgent writes accordion.js/css for detected accordion', async () => {
    const ctx = mockContext({ detectedBlocks: ['accordion'] });
    const agent = new EdsDeveloperAgent();
    const result = await agent.execute(ctx);

    expect(result.success).toBe(true);
    expect(ctx.generatedFiles.has('blocks/accordion/accordion.js')).toBe(true);
    expect(ctx.generatedFiles.has('blocks/accordion/accordion.css')).toBe(true);
    const js = ctx.generatedFiles.get('blocks/accordion/accordion.js')!.content;
    expect(js).toContain('export default function decorate');
    expect(js).toContain('details');
    expect(js).toContain('summary');
  });

  it('AntigravityDeveloperAgent delegates to detected candidates (not cards-only)', async () => {
    const ctx = mockContext({ detectedBlocks: ['accordion'] });
    const agent = new AntigravityDeveloperAgent();
    const result = await agent.execute(ctx);

    expect(result.success).toBe(true);
    expect(ctx.generatedFiles.has('blocks/accordion/accordion.js')).toBe(true);
    expect(ctx.generatedFiles.has('blocks/cards/cards.js')).toBe(false);
  });

  it('QA flags missing detected block assets', async () => {
    const ctx = mockContext({
      detectedBlocks: ['accordion'],
      generatedFiles: new Map([
        [
          'blocks/cards/cards.js',
          {
            path: 'blocks/cards/cards.js',
            content: 'export default function decorate(block) {}',
            operation: 'create' as const,
          },
        ],
      ]),
    });
    // Avoid live Playwright in unit tests
    process.env.VITEST = 'true';
    const agent = new QAValidationAgent();
    await agent.execute(ctx);
    expect(ctx.bugs.some((b) => b.title.includes('accordion'))).toBe(true);
  });

  it('FixAgent regenerates missing accordion assets', async () => {
    const ctx = mockContext({
      detectedBlocks: ['accordion'],
      bugs: [
        {
          id: 'bug1',
          title: 'Missing block assets for accordion',
          severity: 'CRITICAL',
          description: 'Detected block "accordion" has no blocks/accordion/accordion.js',
        },
      ],
    });
    const agent = new FixAgent();
    expect(agent.phase).toBe(RunStatus.FIXING);
    const result = await agent.execute(ctx);
    expect(result.success).toBe(true);
    expect(ctx.generatedFiles.has('blocks/accordion/accordion.js')).toBe(true);
    expect(ctx.bugs[0]?.resolved).toBe(true);
  });
});

// ============================================================
// @aeds/agent — Universal Editor Agent
// Generates component definitions and models for AEM authoring
// ============================================================

import { RunStatus } from '@aeds/shared';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';
import { executeTool } from '../execute-tool.js';

const SECTION_MODEL_PATH = 'models/_section.json';

const DEFAULT_SECTION_COMPONENTS = ['text', 'image', 'button', 'title', 'fragment'] as const;

type SectionModelDoc = {
  definitions?: unknown[];
  models?: unknown[];
  filters?: Array<{ id?: string; components?: string[] }>;
};

function collectCreatedBlockIds(context: RunExecutionContext): string[] {
  const fromFiles = Array.from(context.generatedFiles.keys())
    .map((p) => {
      const match = /^blocks\/([^/]+)\//.exec(p);
      return match?.[1];
    })
    .filter((name): name is string => Boolean(name));

  const fromDetected = (context.detectedBlocks || []).filter(
    (b) => !['header', 'footer'].includes(b),
  );

  return Array.from(new Set([...fromFiles, ...fromDetected])).sort();
}

function buildSectionModel(blockIds: string[]): string {
  const components = Array.from(new Set([...DEFAULT_SECTION_COMPONENTS, ...blockIds]));

  return JSON.stringify(
    {
      definitions: [
        {
          title: 'Section',
          id: 'section',
          plugins: {
            xwalk: {
              page: {
                resourceType: 'core/franklin/components/section/v1/section',
                template: {
                  model: 'section',
                },
              },
            },
          },
        },
      ],
      models: [
        {
          id: 'section',
          fields: [
            {
              component: 'text',
              name: 'name',
              label: 'Section Name',
              description: 'The label shown for this section in the Content Tree',
            },
            {
              component: 'multiselect',
              name: 'style',
              label: 'Style',
              options: [{ name: 'Highlight', value: 'highlight' }],
            },
          ],
        },
      ],
      filters: [
        {
          id: 'section',
          components,
        },
      ],
    },
    null,
    2,
  );
}

/** Append created block IDs that are NotFound in the existing section filter. */
function mergeMissingBlocks(existingJson: string, blockIds: string[]): {
  changed: boolean;
  missing: string[];
  content: string;
} {
  let doc: SectionModelDoc;
  try {
    doc = JSON.parse(existingJson) as SectionModelDoc;
  } catch {
    return { changed: true, missing: blockIds, content: buildSectionModel(blockIds) };
  }

  if (!Array.isArray(doc.filters)) doc.filters = [];
  let section = doc.filters.find((f) => f.id === 'section');
  if (!section) {
    section = { id: 'section', components: [...DEFAULT_SECTION_COMPONENTS] };
    doc.filters.push(section);
  }
  if (!Array.isArray(section.components)) section.components = [];

  const missing = blockIds.filter((id) => !section!.components!.includes(id));
  if (missing.length === 0) {
    return { changed: false, missing: [], content: existingJson };
  }

  section.components = Array.from(new Set([...section.components, ...missing]));
  return {
    changed: true,
    missing,
    content: `${JSON.stringify(doc, null, 2)}\n`,
  };
}

async function readRepoFile(
  context: RunExecutionContext,
  path: string,
): Promise<{ status: 'not_found' | 'found' | 'unavailable'; content?: string }> {
  if (context.skipGitHubPublish || process.env.VITEST || process.env.NODE_ENV === 'test') {
    return { status: 'not_found' };
  }

  try {
    const toolResult = await executeTool(context, 'github.readFile', {
      owner: context.repoOwner,
      repo: context.repoName,
      path,
      ref: context.baseBranch,
    });

    if (!toolResult.success) {
      const err = (toolResult.error || '').toLowerCase();
      if (err.includes('not found') || err.includes('404')) {
        return { status: 'not_found' };
      }
      // Missing token / tool denial → treat as not found for section merge (non-fatal)
      if (err.includes('github_token') || err.includes('not configured') || err.includes('denied')) {
        return { status: 'not_found' };
      }
      return { status: 'unavailable' };
    }

    const data = toolResult.data as { content?: string };
    if (typeof data?.content !== 'string') {
      return { status: 'unavailable' };
    }
    return { status: 'found', content: data.content };
  } catch {
    return { status: 'unavailable' };
  }
}

async function readSectionModel(
  context: RunExecutionContext,
): Promise<{ status: 'not_found' | 'found' | 'unavailable'; content?: string }> {
  return readRepoFile(context, SECTION_MODEL_PATH);
}

export class UniversalEditorAgent extends BaseAgent {
  public readonly id = 'agent-ue';
  public readonly name = 'Universal Editor Specialist';
  public readonly description = 'Generates _component-definition.json and component-models for AEM authoring';
  public readonly phase = RunStatus.UE_AUTHORING;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log('Generating Universal Editor authoring models...');

    const createdBlocks = collectCreatedBlockIds(context);

    const componentDefinition = {
      groups: [
        {
          id: 'eds-blocks',
          title: 'EDS Blocks',
          components: createdBlocks.map((id) => ({
            id,
            title: id.charAt(0).toUpperCase() + id.slice(1),
            description: `${id} EDS block`,
            plugins: {
              xwalk: {
                page: {
                  resourceType: 'core/franklin/components/block/v1/block',
                  template: {
                    name: id.charAt(0).toUpperCase() + id.slice(1),
                    model: id,
                  },
                },
              },
            },
          })),
        },
      ],
    };

    const componentModels = createdBlocks.map((id) => ({
      id,
      fields: [
        {
          component: 'text',
          name: 'title',
          label: 'Title',
          valueType: 'string',
        },
        {
          component: 'richtext',
          name: 'text',
          label: 'Body',
          valueType: 'string',
        },
      ],
    }));

    context.generatedFiles.set('_component-definition.json', {
      path: '_component-definition.json',
      content: JSON.stringify(componentDefinition, null, 2),
      operation: 'create',
    });

    context.generatedFiles.set('_component-models.json', {
      path: '_component-models.json',
      content: JSON.stringify(componentModels, null, 2),
      operation: 'create',
    });

    const filesGenerated = ['_component-definition.json', '_component-models.json'];

    // Per-block XWalk model files — only when NotFound (build:json merges blocks/*/_*.json)
    for (const id of createdBlocks) {
      const title = id.charAt(0).toUpperCase() + id.slice(1);
      const blockModelPath = `blocks/${id}/_${id}.json`;
      if (context.generatedFiles.has(blockModelPath)) continue;

      const existing = await readRepoFile(context, blockModelPath);
      if (existing.status === 'found') {
        context.log(`${blockModelPath} already exists — skipped.`);
        continue;
      }
      if (existing.status === 'unavailable') {
        context.log(`${blockModelPath} could not be checked — skipped.`, 'warn');
        continue;
      }

      context.generatedFiles.set(blockModelPath, {
        path: blockModelPath,
        content: JSON.stringify(
          {
            definitions: [
              {
                title,
                id,
                plugins: {
                  xwalk: {
                    page: {
                      resourceType: 'core/franklin/components/block/v1/block',
                      template: {
                        name: title,
                        model: id,
                      },
                    },
                  },
                },
              },
            ],
            models: [
              {
                id,
                fields: [
                  {
                    component: 'text',
                    valueType: 'string',
                    name: 'title',
                    label: 'Title',
                  },
                  {
                    component: 'richtext',
                    name: 'text',
                    label: 'Text',
                  },
                ],
              },
            ],
            filters: [],
          },
          null,
          2,
        ),
        operation: 'create',
      });
      filesGenerated.push(blockModelPath);
      context.log(`${blockModelPath} NotFound — created block UE model.`);
    }

    let sectionPlan =
      `Skip ${SECTION_MODEL_PATH} (unavailable or unchanged)`;

    // models/_section.json:
    // - NotFound → create with list of created blocks
    // - Found → add only block IDs that are NotFound in filters.section.components
    const sectionLookup = await readSectionModel(context);

    if (sectionLookup.status === 'not_found') {
      context.generatedFiles.set(SECTION_MODEL_PATH, {
        path: SECTION_MODEL_PATH,
        content: buildSectionModel(createdBlocks),
        operation: 'create',
      });
      filesGenerated.push(SECTION_MODEL_PATH);
      sectionPlan = `Create ${SECTION_MODEL_PATH} (NotFound) with blocks: ${createdBlocks.join(', ') || '(none)'}`;
      context.log(
        `${SECTION_MODEL_PATH} NotFound — created section filter with blocks: ${createdBlocks.join(', ') || '(none)'}`,
      );
    } else if (sectionLookup.status === 'found' && sectionLookup.content) {
      const merged = mergeMissingBlocks(sectionLookup.content, createdBlocks);
      if (merged.changed) {
        context.generatedFiles.set(SECTION_MODEL_PATH, {
          path: SECTION_MODEL_PATH,
          content: merged.content,
          operation: 'modify',
        });
        filesGenerated.push(SECTION_MODEL_PATH);
        sectionPlan = `Update ${SECTION_MODEL_PATH}: add NotFound blocks [${merged.missing.join(', ')}]`;
        context.log(
          `${SECTION_MODEL_PATH} exists — added missing block(s) to section filter: ${merged.missing.join(', ')}`,
        );
      } else {
        sectionPlan = `${SECTION_MODEL_PATH} already lists all created blocks — no change`;
        context.log(`${SECTION_MODEL_PATH} already lists all created blocks — skipped.`);
      }
    } else {
      context.log(
        `${SECTION_MODEL_PATH} could not be read — skipped section filter update.`,
        'warn',
      );
    }

    // Optional live UE instrumentation check (feature-flagged)
    if (
      process.env.ENABLE_LIVE_UE === 'true' &&
      !process.env.VITEST &&
      process.env.NODE_ENV !== 'test'
    ) {
      const url = context.previewUrl || context.sourceUrl;
      if (url && /^https?:\/\//i.test(url)) {
        const { validateLiveUeInstrumentation } = await import('../live-ue-validation.js');
        const live = await validateLiveUeInstrumentation(url);
        context.evidence = context.evidence || [];
        context.evidence.push(live.evidence);
        context.log(live.evidence.summary, live.evidence.status === 'PASS' ? 'info' : 'warn');
        if (live.evidence.status === 'FAIL') {
          context.bugs.push({
            id: `bug_ue_live_${Date.now()}`,
            title: 'Live UE instrumentation missing',
            severity: 'SERIOUS',
            description: live.evidence.summary,
          });
        }

        try {
          const { getDatabase, persistUeAuthoringTestRows } = await import('@aeds/database');
          const db = getDatabase();
          await persistUeAuthoringTestRows(db, {
            runId: context.runId,
            pageUrl: url,
            blockName: 'instrumentation',
            phases: [
              {
                action: 'instrumentation',
                status: live.evidence.status,
                errorMessage: live.error,
              },
            ],
          });
        } catch (persistErr: unknown) {
          context.log(
            `ue_authoring_tests persist skipped: ${persistErr instanceof Error ? persistErr.message : String(persistErr)}`,
            'warn',
          );
        }
      } else {
        context.evidence = context.evidence || [];
        context.evidence.push({
          id: `ev_ue_${Date.now()}`,
          kind: 'other',
          status: 'SKIPPED',
          summary: 'Live UE SKIPPED — ENABLE_LIVE_UE=true but no preview/source URL',
          producedAt: new Date().toISOString(),
          mode: 'unavailable',
        });
      }
    }

    // Optional UE chrome SSO authoring cycle (edit→save→reopen) — never fakes PASS
    if (
      process.env.ENABLE_LIVE_UE_AUTHORING === 'true' &&
      !process.env.VITEST &&
      process.env.NODE_ENV !== 'test'
    ) {
      const { validateLiveUeAuthoringCycle } = await import('../live-ue-authoring.js');
      const auth = await validateLiveUeAuthoringCycle({
        contentPageUrl: context.sourceUrl || process.env.UE_CONTENT_PAGE_URL,
        authorUrl: context.authorUrl || process.env.AEM_AUTHOR_URL,
        aemPageId: context.aemPageId,
      });
      context.evidence = context.evidence || [];
      context.evidence.push(auth.evidence);
      context.log(auth.evidence.summary, auth.evidence.status === 'PASS' ? 'info' : 'warn');
      if (auth.evidence.status === 'FAIL') {
        context.bugs.push({
          id: `bug_ue_authoring_${Date.now()}`,
          title: 'Live UE authoring cycle failed',
          severity: 'SERIOUS',
          description: auth.evidence.summary,
        });
      }

      const pageUrl = process.env.UE_EDITOR_URL || context.previewUrl || context.sourceUrl || 'unknown';
      try {
        const { getDatabase, persistUeAuthoringTestRows } = await import('@aeds/database');
        const db = getDatabase();
        const phaseKeys = ['open', 'edit', 'save', 'reopen', 'reopenContent'] as const;
        await persistUeAuthoringTestRows(db, {
          runId: context.runId,
          pageUrl,
          blockName: 'chrome-cycle',
          phases: phaseKeys
            .filter((action) => auth.phases[action] !== undefined)
            .map((action) => ({
              action,
              status: String(auth.phases[action]),
              errorMessage: auth.error,
            })),
        });
      } catch (persistErr: unknown) {
        context.log(
          `ue_authoring_tests persist skipped: ${persistErr instanceof Error ? persistErr.message : String(persistErr)}`,
          'warn',
        );
      }
    }

    const decision = this.createDecision(
      context,
      'Generate Universal Editor authoring contracts',
      [
        'Produce _component-definition.json with block categorization',
        'Produce _component-models.json with field definitions for generated blocks',
        sectionPlan,
        process.env.ENABLE_LIVE_UE === 'true'
          ? 'Live UE instrumentation validation (ENABLE_LIVE_UE)'
          : 'Live UE validation skipped (set ENABLE_LIVE_UE=true)',
        process.env.ENABLE_LIVE_UE_AUTHORING === 'true'
          ? 'Live UE chrome authoring cycle (ENABLE_LIVE_UE_AUTHORING + UE_STORAGE_STATE_PATH)'
          : 'Live UE chrome authoring skipped (set ENABLE_LIVE_UE_AUTHORING=true)',
      ],
      `Universal Editor schemas generated for ${createdBlocks.length} block(s).`,
    );

    return {
      success: true,
      decision,
      filesGenerated,
    };
  }
}

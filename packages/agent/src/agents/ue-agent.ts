// ============================================================
// @aeds/agent — Universal Editor Agent
// Generates component definitions and models for AEM Universal Editor
// ============================================================

import { RunStatus } from '@aeds/shared';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';

export class UniversalEditorAgent extends BaseAgent {
  public readonly id = 'agent-ue';
  public readonly name = 'Universal Editor Specialist';
  public readonly description = 'Generates _component-definition.json and component-models for AEM authoring';
  public readonly phase = RunStatus.UE_AUTHORING;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log('Generating Universal Editor authoring models...');

    const componentDefinition = {
      groups: [
        {
          id: 'eds-blocks',
          title: 'EDS Blocks',
          components: [
            {
              id: 'hero',
              title: 'Hero Banner',
              description: 'Full-bleed hero banner with title, CTA, and background image',
              plugins: {
                xwalk: {
                  page: {
                    resourceType: 'core/franklin/components/block/v1/block',
                    template: {
                      name: 'Hero',
                      model: 'hero',
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    };

    const componentModels = [
      {
        id: 'hero',
        fields: [
          {
            component: 'text',
            name: 'title',
            label: 'Headline',
            valueType: 'string',
            required: true,
          },
          {
            component: 'richtext',
            name: 'text',
            label: 'Description',
            valueType: 'string',
          },
          {
            component: 'reference',
            name: 'image',
            label: 'Hero Image',
            valueType: 'string',
          },
        ],
      },
    ];

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

    const decision = this.createDecision(
      context,
      'Generate Universal Editor authoring contracts',
      [
        'Produce _component-definition.json with block categorization',
        'Produce _component-models.json with field definitions for hero block',
      ],
      'Universal Editor schemas generated to enable immediate WYSIWYG authoring in AEM.'
    );

    return {
      success: true,
      decision,
      filesGenerated: ['_component-definition.json', '_component-models.json'],
    };
  }
}

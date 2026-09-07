import { z } from 'zod';
import type { EDSArchitectureIR, EDSComponentIR } from '@aeds/shared';

export const FieldIRSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  component: z.string().min(1),
  required: z.boolean().optional(),
  multi: z.boolean().optional(),
  valueType: z.string().optional(),
});

export const OptionIRSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string()).min(1),
  defaultValue: z.string().optional(),
});

export const ResponsiveRuleIRSchema = z.object({
  breakpoint: z.string().min(1),
  behavior: z.string().min(1),
});

export const TestCaseIRSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  selector: z.string().optional(),
  assertions: z.array(z.string()).default([]),
});

export const VisualRequirementIRSchema = z.object({
  name: z.string().min(1),
  viewport: z.enum(['desktop', 'tablet', 'mobile']),
  thresholdPercent: z.number().min(0).max(100).optional(),
});

export const EDSComponentIRSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Block names must be kebab-case'),
  type: z.enum(['block', 'section', 'utility']),
  authoring: z.object({
    editable: z.boolean(),
    fields: z.array(FieldIRSchema),
    options: z.array(OptionIRSchema),
  }),
  rendering: z.object({
    semanticHtml: z.string().min(1),
    responsiveBehavior: z.array(ResponsiveRuleIRSchema),
  }),
  implementation: z.object({
    css: z.array(z.string()),
    javascript: z.array(z.string()),
  }),
  dependencies: z.array(z.string()),
  accessibility: z.object({
    requirements: z.array(z.string()),
  }),
  testing: z.object({
    functional: z.array(TestCaseIRSchema),
    visual: z.array(VisualRequirementIRSchema),
  }),
});

export const EDSArchitectureIRSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().optional(),
  createdAt: z.string().min(1),
  components: z.array(EDSComponentIRSchema).min(1),
  reuseDecisions: z.array(
    z.object({
      component: z.string(),
      decision: z.enum(['reuse', 'option', 'new', 'utility']),
      rationale: z.string(),
    }),
  ),
  conventions: z.array(z.string()),
});

export function parseEDSComponentIR(input: unknown): EDSComponentIR {
  return EDSComponentIRSchema.parse(input);
}

export function parseEDSArchitectureIR(input: unknown): EDSArchitectureIR {
  return EDSArchitectureIRSchema.parse(input);
}

export function safeParseEDSArchitectureIR(input: unknown) {
  return EDSArchitectureIRSchema.safeParse(input);
}

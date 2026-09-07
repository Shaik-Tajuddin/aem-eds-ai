import { z } from 'zod';

export const EvaluationDimensionSchema = z.enum([
  'architecture',
  'code',
  'edsConvention',
  'universalEditor',
  'build',
  'tests',
  'accessibility',
  'performance',
  'visual',
  'regression',
]);

export type EvaluationDimension = z.infer<typeof EvaluationDimensionSchema>;

export const EvaluationTaskIdSchema = z.enum([
  'create-hero',
  'create-product-grid',
  'create-carousel-ue',
  'convert-website-hero',
  'convert-screenshot-eds',
  'fix-visual-mismatch',
  'fix-ue-authoring',
  'fix-javascript-error',
  'improve-accessibility',
  'improve-performance',
  'refactor-existing-block',
]);

export type EvaluationTaskId = z.infer<typeof EvaluationTaskIdSchema>;

export interface EvaluationTask {
  id: EvaluationTaskId;
  title: string;
  description: string;
  requiredDimensions: EvaluationDimension[];
}

export interface DimensionScore {
  dimension: EvaluationDimension;
  score: number; // 0–100
  evidenceRefs: string[];
  notes?: string;
}

export interface EvaluationRunInput {
  taskId: EvaluationTaskId;
  runId: string;
  evidence: Array<{
    kind: string;
    status: string;
    summary: string;
    id?: string;
  }>;
  bugsOpen?: number;
  humanApproved?: boolean;
}

export interface EvaluationResult {
  taskId: EvaluationTaskId;
  runId: string;
  dimensions: DimensionScore[];
  overall: number;
  passed: boolean;
  scoredAt: string;
}

export const BENCHMARK_TASKS: EvaluationTask[] = [
  {
    id: 'create-hero',
    title: 'Create Hero',
    description: 'Implement a responsive hero block with UE fields',
    requiredDimensions: ['architecture', 'code', 'edsConvention', 'build', 'visual', 'accessibility'],
  },
  {
    id: 'create-product-grid',
    title: 'Create responsive Product Grid',
    description: 'Cards/grid following project conventions',
    requiredDimensions: ['architecture', 'code', 'edsConvention', 'build', 'tests'],
  },
  {
    id: 'create-carousel-ue',
    title: 'Create Carousel with UE',
    description: 'Carousel with Universal Editor authoring',
    requiredDimensions: ['universalEditor', 'code', 'build', 'accessibility'],
  },
  {
    id: 'convert-website-hero',
    title: 'Convert website Hero',
    description: 'Map existing site hero to EDS blocks',
    requiredDimensions: ['architecture', 'code', 'visual'],
  },
  {
    id: 'convert-screenshot-eds',
    title: 'Convert screenshot to EDS',
    description: 'Screenshot → Design IR → EDS',
    requiredDimensions: ['architecture', 'visual', 'code'],
  },
  {
    id: 'fix-visual-mismatch',
    title: 'Fix visual mismatch',
    description: 'Self-heal visual regression below threshold',
    requiredDimensions: ['visual', 'regression', 'code'],
  },
  {
    id: 'fix-ue-authoring',
    title: 'Fix UE authoring',
    description: 'Repair models/filters and persisted content',
    requiredDimensions: ['universalEditor', 'regression'],
  },
  {
    id: 'fix-javascript-error',
    title: 'Fix JavaScript error',
    description: 'Diagnose console/network failure and patch',
    requiredDimensions: ['tests', 'code', 'regression'],
  },
  {
    id: 'improve-accessibility',
    title: 'Improve accessibility',
    description: 'Clear axe/static a11y failures',
    requiredDimensions: ['accessibility', 'regression'],
  },
  {
    id: 'improve-performance',
    title: 'Improve performance',
    description: 'Meet budget / LCP / Lighthouse thresholds',
    requiredDimensions: ['performance', 'regression'],
  },
  {
    id: 'refactor-existing-block',
    title: 'Refactor existing block',
    description: 'Reuse/options over duplication',
    requiredDimensions: ['architecture', 'edsConvention', 'regression'],
  },
];

const KIND_TO_DIMENSION: Record<string, EvaluationDimension> = {
  build: 'build',
  browser: 'tests',
  visual: 'visual',
  accessibility: 'accessibility',
  performance: 'performance',
  'quality-gate': 'regression',
  other: 'universalEditor',
};

function statusToScore(status: string): number {
  switch (status) {
    case 'PASS':
      return 100;
    case 'SKIPPED':
      return 50;
    case 'UNAVAILABLE':
      return 40;
    case 'FAIL':
      return 0;
    default:
      return 30;
  }
}

/**
 * Scores a run against a benchmark task using system evidence only.
 * Does not invent PASS — SKIPPED/UNAVAILABLE score below pass threshold.
 */
export function scoreEvaluationRun(input: EvaluationRunInput, passThreshold = 70): EvaluationResult {
  const task = BENCHMARK_TASKS.find((t) => t.id === input.taskId);
  if (!task) {
    throw new Error(`Unknown evaluation task: ${input.taskId}`);
  }

  const byDimension = new Map<EvaluationDimension, DimensionScore>();

  for (const dim of task.requiredDimensions) {
    byDimension.set(dim, {
      dimension: dim,
      score: 0,
      evidenceRefs: [],
      notes: 'No evidence yet',
    });
  }

  for (const ev of input.evidence) {
    const dim = KIND_TO_DIMENSION[ev.kind] || null;
    if (!dim || !byDimension.has(dim)) continue;
    const score = statusToScore(ev.status);
    const current = byDimension.get(dim)!;
    // Keep best score for dimension when multiple evidence rows
    if (score >= current.score) {
      byDimension.set(dim, {
        dimension: dim,
        score,
        evidenceRefs: [...current.evidenceRefs, ev.id || ev.summary.slice(0, 80)],
        notes: ev.summary,
      });
    }
  }

  // Architecture/code/edsConvention: heuristic from presence of build PASS + no open bugs
  for (const soft of ['architecture', 'code', 'edsConvention'] as EvaluationDimension[]) {
    if (!byDimension.has(soft)) continue;
    const build = byDimension.get('build');
    const base = build?.score === 100 ? 80 : build?.score === 50 ? 55 : 35;
    const penalty = (input.bugsOpen || 0) > 0 ? 15 : 0;
    const existing = byDimension.get(soft)!;
    if (existing.evidenceRefs.length === 0) {
      byDimension.set(soft, {
        dimension: soft,
        score: Math.max(0, base - penalty),
        evidenceRefs: build?.evidenceRefs || [],
        notes: 'Derived from build evidence + open bugs (not a claim of human review)',
      });
    }
  }

  if (input.humanApproved) {
    for (const [dim, row] of byDimension) {
      byDimension.set(dim, { ...row, score: Math.min(100, row.score + 5) });
    }
  }

  const dimensions = Array.from(byDimension.values());
  const overall =
    dimensions.length === 0
      ? 0
      : Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);

  // All required dimensions must meet threshold — SKIPPED/UNAVAILABLE cannot inflate a PASS
  const allDimensionsPass = dimensions.every((d) => d.score >= passThreshold);

  return {
    taskId: input.taskId,
    runId: input.runId,
    dimensions,
    overall,
    passed: allDimensionsPass && (input.bugsOpen || 0) === 0,
    scoredAt: new Date().toISOString(),
  };
}

export function listBenchmarkTasks(): EvaluationTask[] {
  return [...BENCHMARK_TASKS];
}

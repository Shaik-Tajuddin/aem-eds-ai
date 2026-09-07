# Evaluation

Package: `@aeds/evaluation`

## Purpose

Score agent runs against benchmark tasks using **system evidence only**. SKIPPED/UNAVAILABLE never count as full PASS.

## Benchmark tasks

See `listBenchmarkTasks()` — includes create-hero, product grid, carousel+UE, convert website/screenshot, fix visual/UE/JS, improve a11y/perf, refactor block.

## Dimensions

architecture · code · edsConvention · universalEditor · build · tests · accessibility · performance · visual · regression

## API

```ts
import { scoreEvaluationRun, listBenchmarkTasks } from '@aeds/evaluation';

const result = scoreEvaluationRun({
  taskId: 'create-hero',
  runId: '…',
  evidence: [{ kind: 'build', status: 'PASS', summary: '…' }],
  bugsOpen: 0,
});
```

HTTP:

- `GET /api/tools/evaluation/tasks`
- `POST /api/tools/evaluation/score`

## Dataset (future)

`dataset/architecture|coding|universal-editor|debugging|visual|testing/` — store only rights-cleared, human-approved examples.

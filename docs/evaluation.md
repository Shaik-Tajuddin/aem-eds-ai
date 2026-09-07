# Evaluation

## Today (implemented)

- **Quality gate agent** aggregates system evidence (build, browser, visual, a11y, performance)
- **Self-healing loop** scores progress via bug resolution and regression
- **LLM cost/latency** records for usage dashboards
- **Run comparison UI** (`/dashboard/runs/compare`) for side-by-side runs
- **Unit/integration Vitest suites** across packages

## Planned (Master Prompt §53)

Benchmark tasks such as:

- Create Hero / Product Grid / Carousel with UE
- Convert website or screenshot to EDS
- Fix visual mismatch / UE authoring / JS error
- Improve a11y / performance
- Refactor existing block

Score dimensions: Architecture, Code, EDS Convention, UE, Build, Tests, Accessibility, Performance, Visual, Regression.

Dataset folders (future): `dataset/architecture|coding|universal-editor|debugging|visual|testing/`.

## Training strategy

Do **not** fine-tune initially. Prefer:

Base LLM + RAG + Skills + Project Context + Tools + Engineering IR + Automated Validation

Only approved, rights-cleared examples become high-confidence knowledge.

## Honesty

`npm run demo` is simulated. Evaluation claims require real tool evidence and human-approved labels where applicable.

# Universal Editor

## Goal

Configure and validate authoring contracts so content is editable and persisted correctly.

## Artifacts

- `_component-definition.json`
- `_component-models.json`
- `_component-filters.json`
- `data-aue-*` DOM instrumentation

## Classes (`@aeds/aem`)

| Class | Role |
|---|---|
| `UniversalEditorModelGenerator` | Build UE JSON from block manifests |
| `UniversalEditorValidator` | Validate schemas + instrumentation |
| `UniversalEditorTester` | Compare authored vs persisted vs rendered values (logic tests) |

## Agent

`UniversalEditorAgent` generates/updates UE artifacts during `UE_AUTHORING`.

## Live authoring loop (status)

Target sequence: open UE → identify fields → edit → save → reopen → verify.

Today: models/validators/tester exist; **full live UE browser automation is feature-flagged / next**. Do not claim UE PASS without evidence.

## Auth reminder

AEM API credentials ≠ UE browser session credentials. Neither belongs in frontend EDS code.

# Agent Skills

Package: `@aeds/agent-skills`.

Skills are **versioned procedures**, not free-form prompts. Each skill includes purpose, when-to-use, inputs, preconditions, procedure, constraints, examples, anti-patterns, validation, and failure conditions.

## Current skills (v1.0.0)

| ID | Purpose |
|---|---|
| `eds-create-block` | Create/reuse EDS blocks with full validate loop |
| `eds-architecture` | Emit validated `EDSArchitectureIR` before coding |
| `eds-universal-editor` | UE models / filters / authoring checks |

## API

```ts
import { getSkill, getSkillPromptSection, ALL_SKILLS } from '@aeds/agent-skills';
```

`ArchitectureAgent` currently injects `eds-architecture` via `getSkillPromptSection`.

## Create-block procedure (summary)

1. Inspect repository  
2. Search existing blocks/utilities  
3. Decide reuse vs option vs new  
4. Design semantic HTML  
5. Implement CSS; JS only if needed  
6. Configure UE model/definition/filter  
7. Lint → build → preview  
8. Browser / a11y / visual  
9. Diagnose → fix → regress  

Never skip validation because code “looks correct.”

## Extending

Add a new skill object to `packages/agent-skills/src/index.ts`, bump `version`, wire into the relevant agent’s system instructions.

export interface AgentSkill {
  id: string;
  version: string;
  purpose: string;
  whenToUse: string[];
  inputs: string[];
  preconditions: string[];
  procedure: string[];
  constraints: string[];
  examples: string[];
  antiPatterns: string[];
  validation: string[];
  failureConditions: string[];
}

export const EDS_CREATE_BLOCK_SKILL: AgentSkill = {
  id: 'eds-create-block',
  version: '1.0.0',
  purpose: 'Create or reuse an EDS block with authoring, CSS/JS, and validation.',
  whenToUse: [
    'Architecture IR requires a new block',
    'Existing block cannot satisfy the requirement via options',
  ],
  inputs: ['EDSComponentIR', 'EDSProjectProfile', 'repository tree'],
  preconditions: [
    'Repository analyzed',
    'Existing blocks searched',
    'Reuse vs new decision recorded',
  ],
  procedure: [
    'Inspect repository',
    'Search existing blocks and utilities',
    'Decide reuse / block option / new block',
    'Design semantic HTML',
    'Implement CSS (localized)',
    'Add JS only if necessary',
    'Configure UE model/definition/filter',
    'Lint, build, preview',
    'Run browser, a11y, visual checks',
    'Diagnose/fix/regress on failures',
  ],
  constraints: [
    'Prefer existing blocks',
    'No secrets in client code',
    'Never skip validation because code looks correct',
    'Smallest safe change when fixing',
  ],
  examples: ['Create hero from Design IR using project hero conventions'],
  antiPatterns: [
    'Figma → JavaScript without IR',
    'Duplicate CSS across blocks',
    'Claim PASS without evidence',
  ],
  validation: [
    'decorate() export present',
    'Build/lint evidence recorded',
    'UE schemas valid JSON',
  ],
  failureConditions: [
    'No decorate export',
    'Build failed',
    'Quality gate failed without diagnosis',
  ],
};

export const EDS_ARCHITECTURE_SKILL: AgentSkill = {
  id: 'eds-architecture',
  version: '1.0.0',
  purpose: 'Produce validated EDSArchitectureIR before coding.',
  whenToUse: ['After project analysis', 'Before EDS Developer agent'],
  inputs: ['Design IR or NL requirements', 'project profile'],
  preconditions: ['Project analyzer completed'],
  procedure: [
    'Map requirements to sections/blocks',
    'Prefer reuse and block options',
    'Emit EDSComponentIR per component',
    'Validate with Zod schemas',
  ],
  constraints: [
    'Project convention > generic LLM knowledge',
    'Official Adobe docs preferred for changing APIs',
  ],
  examples: ['Hero + cards page architecture'],
  antiPatterns: ['Generating code before IR'],
  validation: ['EDSArchitectureIRSchema.parse succeeds'],
  failureConditions: ['Invalid IR', 'No reuse decisions'],
};

export const EDS_UNIVERSAL_EDITOR_SKILL: AgentSkill = {
  id: 'eds-universal-editor',
  version: '1.0.0',
  purpose: 'Configure and validate Universal Editor authoring contracts.',
  whenToUse: ['After block implementation', 'When UE authoring required'],
  inputs: ['EDSComponentIR', 'generated block files'],
  preconditions: ['Block markup and models planned'],
  procedure: [
    'Generate component definition/models/filters',
    'Instrument data-aue-* where required',
    'Validate JSON schemas',
    'Author/save/reopen when live UE available',
  ],
  constraints: [
    'Never put AEM credentials in frontend',
    'Distinguish AEM API auth from UE browser auth',
  ],
  examples: ['UE model for hero title/image fields'],
  antiPatterns: ['Fake UE PASS without open/edit/save evidence'],
  validation: ['Valid _component-*.json', 'Optional live authoring evidence'],
  failureConditions: ['Invalid models', 'Content not persisted'],
};

export const ALL_SKILLS: AgentSkill[] = [
  EDS_CREATE_BLOCK_SKILL,
  EDS_ARCHITECTURE_SKILL,
  EDS_UNIVERSAL_EDITOR_SKILL,
];

export function getSkill(id: string): AgentSkill | undefined {
  return ALL_SKILLS.find((s) => s.id === id);
}

export function getSkillPromptSection(id: string): string {
  const skill = getSkill(id);
  if (!skill) return '';
  return [
    `# Skill: ${skill.id} v${skill.version}`,
    `Purpose: ${skill.purpose}`,
    'Procedure:',
    ...skill.procedure.map((p, i) => `${i + 1}. ${p}`),
    'Constraints:',
    ...skill.constraints.map((c) => `- ${c}`),
    'Anti-patterns:',
    ...skill.antiPatterns.map((a) => `- ${a}`),
  ].join('\n');
}

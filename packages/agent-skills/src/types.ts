// ============================================================
// @aeds/agent-skills — Types
// Domain models for AEM EDS agent skills
// ============================================================

export type SkillCategory =
  | 'development'
  | 'quality'
  | 'architecture'
  | 'authoring'
  | 'seo'
  | 'operations'
  | 'migration'
  | 'commerce'
  | 'analytics'
  | 'devops';

export type SkillPhase =
  | 'analysis'
  | 'planning'
  | 'code_generation'
  | 'build'
  | 'testing'
  | 'qa'
  | 'authoring'
  | 'deployment'
  | 'fix';

export interface AgentSkill {
  id: string;
  version: string;
  purpose: string;
  category?: SkillCategory;
  phases?: SkillPhase[];
  whenToUse: string[];
  inputs: string[];
  preconditions: string[];
  procedure: string[];
  constraints: string[];
  examples: string[];
  antiPatterns: string[];
  validation: string[];
  failureConditions: string[];
  tags?: string[];
  references?: string[];
}

export interface SkillCatalogEntry {
  id: string;
  name: string;
  category: SkillCategory;
  phases: SkillPhase[];
  description: string;
  primaryAgent: string;
  inputs: string[];
  tags: string[];
}

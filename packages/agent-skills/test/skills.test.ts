import { describe, it, expect } from 'vitest';
import {
  getSkill,
  getSkillPromptSection,
  getSkillsPromptSection,
  getAllSkills,
  getSkillsByCategory,
  getSkillsByPhase,
  searchSkills,
  parseSkillMarkdown,
  loadSkillsFromDirectory,
  findWorkspaceSkillsDir,
  ALL_SKILLS,
  EDS_SKILL_CATALOG,
} from '../src/index.js';

describe('agent-skills', () => {
  it('loads versioned skills and preserves backwards compatibility', () => {
    expect(ALL_SKILLS.length).toBeGreaterThanOrEqual(19);
    expect(getSkill('eds-create-block')?.version).toBe('1.0.0');
    expect(getSkill('block-scaffolder')?.category).toBe('development');
    expect(getSkill('cwv-optimizer')?.phases).toContain('qa');
    expect(getSkill('accessibility-fix')?.category).toBe('quality');
  });

  it('renders prompt section for individual skills', () => {
    const text = getSkillPromptSection('eds-architecture');
    expect(text).toContain('EDSArchitectureIR');
    expect(text).toContain('Procedure:');
    expect(text).toContain('Constraints:');
  });

  it('renders combined prompt section for multiple skills', () => {
    const text = getSkillsPromptSection(['block-scaffolder', 'cwv-optimizer']);
    expect(text).toContain('block-scaffolder');
    expect(text).toContain('cwv-optimizer');
    expect(text).toContain('decorate');
    expect(text).toContain('Core Web Vitals');
  });

  it('parses SKILL.md markdown format correctly', () => {
    const sampleMarkdown = `---
name: sample-custom-skill
description: A custom test skill for EDS authoring.
version: "2.1.0"
---

# Sample Custom Skill
A helpful tool for authors.

## When to Use
- When authors need guidance
- Pre-publish checks

## Do NOT Use
- For automated CI/CD builds

## Key Principles
- Keep authoring intuitive
- Validate table inputs

## Step 1: Initialize
Open document in da.live.

## Step 2: Validate
Check table headers.

## Produce Validation Checklist
- All columns have headers
- Variant names in parentheses
`;

    const parsed = parseSkillMarkdown(sampleMarkdown);
    expect(parsed.id).toBe('sample-custom-skill');
    expect(parsed.version).toBe('2.1.0');
    expect(parsed.purpose).toBe('A custom test skill for EDS authoring.');
    expect(parsed.whenToUse).toHaveLength(2);
    expect(parsed.antiPatterns).toContain('For automated CI/CD builds');
    expect(parsed.constraints).toContain('Keep authoring intuitive');
    expect(parsed.procedure).toContain('Initialize');
    expect(parsed.procedure).toContain('Validate');
    expect(parsed.validation).toContain('All columns have headers');
  });

  it('discovers and loads skills from .agents/skills directory', () => {
    const dir = findWorkspaceSkillsDir();
    expect(dir).toBeDefined();

    const allSkills = getAllSkills(true);
    // Should have 42 or more skills loaded from the repository
    expect(allSkills.length).toBeGreaterThanOrEqual(42);

    // Verify presence of specific skills from the Focus-GTS catalog
    expect(getSkill('reading-level')).toBeDefined();
    expect(getSkill('link-rot-scanner')).toBeDefined();
    expect(getSkill('optel-interpreter')).toBeDefined();
    expect(getSkill('geo-rewrite')).toBeDefined();
  });

  it('filters skills by category', () => {
    const devSkills = getSkillsByCategory('development');
    expect(devSkills.length).toBeGreaterThanOrEqual(4);
    expect(devSkills.some((s) => s.id === 'block-scaffolder')).toBe(true);

    const qualitySkills = getSkillsByCategory('quality');
    expect(qualitySkills.length).toBeGreaterThanOrEqual(5);
    expect(qualitySkills.some((s) => s.id === 'accessibility-fix')).toBe(true);
  });

  it('filters skills by lifecycle phase', () => {
    const codeGenSkills = getSkillsByPhase('code_generation');
    expect(codeGenSkills.length).toBeGreaterThanOrEqual(3);
    expect(codeGenSkills.some((s) => s.id === 'block-scaffolder')).toBe(true);

    const qaSkills = getSkillsByPhase('qa');
    expect(qaSkills.length).toBeGreaterThanOrEqual(5);
    expect(qaSkills.some((s) => s.id === 'publish-readiness')).toBe(true);
  });

  it('searches skills by keyword', () => {
    const cwvResults = searchSkills('vitals');
    expect(cwvResults.length).toBeGreaterThanOrEqual(1);
    expect(cwvResults.some((s) => s.id === 'cwv-optimizer')).toBe(true);

    const a11yResults = searchSkills('accessibility');
    expect(a11yResults.length).toBeGreaterThanOrEqual(2);
  });

  it('provides a catalog of all 42 skills with metadata', () => {
    expect(EDS_SKILL_CATALOG.length).toBe(42);
    const catalogItem = EDS_SKILL_CATALOG.find((s) => s.id === 'aem-to-eds-migration');
    expect(catalogItem).toBeDefined();
    expect(catalogItem?.category).toBe('architecture');
    expect(catalogItem?.primaryAgent).toBe('agent-architecture');
  });
});

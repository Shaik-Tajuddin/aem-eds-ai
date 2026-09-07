import { describe, it, expect } from 'vitest';
import { getSkill, getSkillPromptSection, ALL_SKILLS } from '../src/index.js';

describe('agent-skills', () => {
  it('loads versioned skills', () => {
    expect(ALL_SKILLS.length).toBeGreaterThanOrEqual(3);
    expect(getSkill('eds-create-block')?.version).toBe('1.0.0');
  });

  it('renders prompt section', () => {
    const text = getSkillPromptSection('eds-architecture');
    expect(text).toContain('EDSArchitectureIR');
    expect(text).toContain('Procedure:');
  });
});

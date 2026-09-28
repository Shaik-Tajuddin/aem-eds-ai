// ============================================================
// @aeds/agent-skills — Skill Loader & Registry
// Manages built-in, workspace, and dynamic agent skills
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import type { AgentSkill, SkillCategory, SkillPhase } from './types.js';
import { parseSkillMarkdown } from './parser.js';
import { BUILTIN_SKILLS } from './skills/builtin-skills.js';
import { EDS_SKILL_CATALOG, getCatalogEntry } from './catalog.js';

const skillRegistry = new Map<string, AgentSkill>();

// Initialize registry with built-in skills
for (const skill of BUILTIN_SKILLS) {
  skillRegistry.set(skill.id, skill);
}

/**
 * Searches up from cwd to locate `.agents/skills` directory
 */
export function findWorkspaceSkillsDir(startDir: string = process.cwd()): string | undefined {
  let curr = path.resolve(startDir);
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(curr, '.agents', 'skills');
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return undefined;
}

/**
 * Loads a single skill from a SKILL.md file
 */
export function loadSkillFromFile(filePath: string): AgentSkill | undefined {
  try {
    if (!fs.existsSync(filePath)) return undefined;
    const content = fs.readFileSync(filePath, 'utf8');
    const dirName = path.basename(path.dirname(filePath));
    const skill = parseSkillMarkdown(content, dirName);

    // Enrich with catalog metadata if available
    const catalogItem = getCatalogEntry(skill.id);
    if (catalogItem) {
      skill.category = skill.category || catalogItem.category;
      skill.phases = skill.phases || catalogItem.phases;
      skill.tags = skill.tags || catalogItem.tags;
    }

    skillRegistry.set(skill.id, skill);
    return skill;
  } catch {
    return undefined;
  }
}

/**
 * Scans a directory of skills (e.g. .agents/skills) and registers all discovered skills
 */
export function loadSkillsFromDirectory(dirPath?: string): AgentSkill[] {
  const targetDir = dirPath || findWorkspaceSkillsDir();
  if (!targetDir || !fs.existsSync(targetDir)) {
    return Array.from(skillRegistry.values());
  }

  try {
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillMd = path.join(targetDir, entry.name, 'SKILL.md');
      if (fs.existsSync(skillMd)) {
        // Do not overwrite built-ins with less detailed markdown unless explicitly needed
        if (!skillRegistry.has(entry.name)) {
          loadSkillFromFile(skillMd);
        }
      }
    }
  } catch {
    // Return existing registry in restricted environments
  }

  return Array.from(skillRegistry.values());
}

/**
 * Retrieve a skill by ID
 */
export function getSkill(id: string): AgentSkill | undefined {
  if (skillRegistry.has(id)) {
    return skillRegistry.get(id);
  }

  // Attempt lazy resolution from workspace .agents/skills
  const skillsDir = findWorkspaceSkillsDir();
  if (skillsDir) {
    const skillPath = path.join(skillsDir, id, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      return loadSkillFromFile(skillPath);
    }
  }

  return undefined;
}

/**
 * Retrieve all skills currently registered (and optionally scans workspace skills)
 */
export function getAllSkills(autoScan = true): AgentSkill[] {
  if (autoScan) {
    loadSkillsFromDirectory();
  }
  return Array.from(skillRegistry.values());
}

/**
 * Filter skills by category
 */
export function getSkillsByCategory(category: SkillCategory): AgentSkill[] {
  getAllSkills(true);
  return Array.from(skillRegistry.values()).filter((s) => s.category === category);
}

/**
 * Filter skills by lifecycle phase
 */
export function getSkillsByPhase(phase: SkillPhase | string): AgentSkill[] {
  getAllSkills(true);
  return Array.from(skillRegistry.values()).filter((s) => s.phases?.includes(phase as SkillPhase));
}

/**
 * Search skills by keyword
 */
export function searchSkills(query: string): AgentSkill[] {
  getAllSkills(true);
  const q = query.toLowerCase().trim();
  if (!q) return Array.from(skillRegistry.values());

  return Array.from(skillRegistry.values()).filter(
    (s) =>
      s.id.toLowerCase().includes(q) ||
      s.purpose.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.tags?.some((t) => t.toLowerCase().includes(q)) ||
      s.whenToUse.some((w) => w.toLowerCase().includes(q)),
  );
}

/**
 * Generate formatted prompt instructions for a single skill
 */
export function getSkillPromptSection(id: string): string {
  const skill = getSkill(id);
  if (!skill) return '';
  const lines: string[] = [
    `# Skill: ${skill.id} v${skill.version}`,
    `Purpose: ${skill.purpose}`,
  ];

  if (skill.whenToUse.length > 0) {
    lines.push('When to Use:');
    for (const w of skill.whenToUse) lines.push(`- ${w}`);
  }

  if (skill.procedure.length > 0) {
    lines.push('Procedure:');
    skill.procedure.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
  }

  if (skill.constraints.length > 0) {
    lines.push('Constraints:');
    for (const c of skill.constraints) lines.push(`- ${c}`);
  }

  if (skill.antiPatterns.length > 0) {
    lines.push('Anti-patterns:');
    for (const a of skill.antiPatterns) lines.push(`- ${a}`);
  }

  if (skill.validation.length > 0) {
    lines.push('Validation Checklist:');
    for (const v of skill.validation) lines.push(`- [ ] ${v}`);
  }

  return lines.join('\n');
}

/**
 * Generate formatted prompt instructions for multiple skills combined
 */
export function getSkillsPromptSection(ids: string[]): string {
  const sections: string[] = [];
  for (const id of ids) {
    const text = getSkillPromptSection(id);
    if (text) sections.push(text);
  }
  return sections.join('\n\n---\n\n');
}

// For backwards compatibility
export const ALL_SKILLS = BUILTIN_SKILLS;

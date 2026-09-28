// ============================================================
// @aeds/agent-skills — Markdown Skill Parser
// Parses SKILL.md format into structured AgentSkill objects
// ============================================================

import type { AgentSkill } from './types.js';

function extractFrontmatter(markdown: string): { frontmatter: Record<string, string>; body: string } {
  const frontmatter: Record<string, string> = {};
  if (!markdown.startsWith('---')) {
    return { frontmatter, body: markdown };
  }

  const endIdx = markdown.indexOf('\n---', 3);
  if (endIdx === -1) {
    return { frontmatter, body: markdown };
  }

  const rawFm = markdown.slice(3, endIdx).trim();
  const body = markdown.slice(endIdx + 4).trim();

  for (const line of rawFm.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      frontmatter[key] = val;
    }
  }

  return { frontmatter, body };
}

function extractSectionBullets(body: string, sectionTitleRegex: RegExp): string[] {
  const match = body.match(sectionTitleRegex);
  if (!match || match.index === undefined) return [];

  const start = match.index + match[0].length;
  const nextHeadingIdx = body.slice(start).search(/\n##\s+/);
  const sectionContent = nextHeadingIdx === -1 ? body.slice(start) : body.slice(start, start + nextHeadingIdx);

  const bullets: string[] = [];
  for (const line of sectionContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      bullets.push(trimmed.slice(2).trim());
    } else if (/^\d+\.\s+/.test(trimmed)) {
      bullets.push(trimmed.replace(/^\d+\.\s+/, '').trim());
    }
  }
  return bullets;
}

function extractSteps(body: string): string[] {
  const steps: string[] = [];
  const stepRegex = /##\s+(?:Step\s*\d*[:\s]*|Workflow[:\s]*)(.+)/gi;
  let match: RegExpExecArray | null;
  while ((match = stepRegex.exec(body)) !== null) {
    const title = match[1]?.trim();
    if (title) steps.push(title);
  }

  if (steps.length === 0) {
    // Fallback: check for standard procedure or workflow heading bullets
    const bullets = extractSectionBullets(body, /##\s+(?:Procedure|Workflow|Process|Execution Steps)[^\n]*/i);
    if (bullets.length > 0) {
      return bullets;
    }
  }
  return steps;
}

export function parseSkillMarkdown(markdown: string, idHint?: string): AgentSkill {
  const { frontmatter, body } = extractFrontmatter(markdown);

  const id = frontmatter['name'] || idHint || 'unknown-skill';
  const version = frontmatter['version'] || '1.0.0';
  const purpose = frontmatter['description'] || (() => {
    const firstP = body.split('\n\n').find((p) => !p.startsWith('#') && p.trim().length > 10);
    return firstP?.replace(/\n/g, ' ').trim() || id;
  })();

  const whenToUse = extractSectionBullets(body, /##\s+When to Use[^\n]*/i);
  const antiPatterns = [
    ...extractSectionBullets(body, /##\s+Do NOT Use[^\n]*/i),
    ...extractSectionBullets(body, /##\s+Anti-Patterns[^\n]*/i),
  ];

  const constraints = [
    ...extractSectionBullets(body, /##\s+(?:Key Principles|Constraints|Core Rules|Rules)[^\n]*/i),
  ];

  const procedure = extractSteps(body);
  const validation = [
    ...extractSectionBullets(body, /##\s+(?:Validation|Checklist|Produce Validation Checklist)[^\n]*/i),
  ];
  const failureConditions = [
    ...extractSectionBullets(body, /##\s+(?:Troubleshooting|Failure Conditions|Common Pitfalls)[^\n]*/i),
  ];

  return {
    id,
    version,
    purpose,
    whenToUse: whenToUse.length > 0 ? whenToUse : [`When ${id} operation is requested`],
    inputs: ['EDS project repository', 'URL or block requirements'],
    preconditions: ['Project analyzed'],
    procedure: procedure.length > 0 ? procedure : ['Analyze requirements', 'Apply EDS conventions', 'Validate output'],
    constraints: constraints.length > 0 ? constraints : ['Follow EDS architectural standards'],
    examples: [],
    antiPatterns: antiPatterns.length > 0 ? antiPatterns : ['Applying non-EDS conventions'],
    validation: validation.length > 0 ? validation : ['Passes EDS build and quality validation'],
    failureConditions: failureConditions.length > 0 ? failureConditions : ['Build or quality checks failed'],
  };
}

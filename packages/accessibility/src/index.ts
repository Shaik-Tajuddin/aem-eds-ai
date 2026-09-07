export interface AccessibilityViolation {
  id: string;
  impact?: string;
  description: string;
  nodes: string[];
}

export interface AccessibilityAuditResult {
  mode: 'static' | 'axe-source';
  passed: boolean;
  violations: AccessibilityViolation[];
  summary: string;
}

/**
 * Static HTML accessibility heuristics (no browser).
 * Used when live axe injection is unavailable; never reported as live axe PASS.
 */
export function auditHtmlStatic(html: string): AccessibilityAuditResult {
  const violations: AccessibilityViolation[] = [];

  const imgWithoutAlt = html.match(/<img(?![^>]*\balt=)[^>]*>/gi) || [];
  if (imgWithoutAlt.length > 0) {
    violations.push({
      id: 'image-alt',
      impact: 'critical',
      description: `${imgWithoutAlt.length} <img> element(s) missing alt attribute`,
      nodes: imgWithoutAlt.slice(0, 5),
    });
  }

  const hasHeading = /<h[1-6]\b/i.test(html);
  if (html.includes('<section') && !hasHeading) {
    violations.push({
      id: 'heading-missing',
      impact: 'moderate',
      description: 'Section markup present without heading elements',
      nodes: [],
    });
  }

  const buttonEmpty = html.match(/<button(?:\s[^>]*)?>\s*<\/button>/gi) || [];
  if (buttonEmpty.length > 0) {
    violations.push({
      id: 'button-name',
      impact: 'serious',
      description: `${buttonEmpty.length} empty <button> element(s)`,
      nodes: buttonEmpty.slice(0, 5),
    });
  }

  return {
    mode: 'static',
    passed: violations.length === 0,
    violations,
    summary:
      violations.length === 0
        ? 'Static HTML accessibility heuristics passed'
        : `Static a11y found ${violations.length} violation(s)`,
  };
}

export { getAxeSource } from './axe-source.js';

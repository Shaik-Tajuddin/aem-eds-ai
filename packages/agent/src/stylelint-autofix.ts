// ============================================================
// @aeds/agent — Stylelint residual auto-fix
// Handles rules that `stylelint --fix` cannot rewrite
// ============================================================

/** Strip ANSI color codes from CLI output. */
export function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}

export interface DescendingSpecificityIssue {
  file: string;
  /** Selector that must appear earlier (e.g. "main em") */
  moveSelector: string;
  /** Selector that currently appears too early (e.g. "main p em") */
  beforeSelector: string;
  /** Line of the earlier (too-specific-early) selector */
  line?: number;
}

export interface SingleLineMaxDeclarationsIssue {
  file: string;
  line: number;
  column?: number;
}

/**
 * Parse stylelint no-descending-specificity messages from lint:fix output.
 */
export function parseDescendingSpecificityIssues(lintOutput: string): DescendingSpecificityIssue[] {
  const text = stripAnsi(lintOutput);
  const issues: DescendingSpecificityIssue[] = [];
  const lines = text.split(/\r?\n/);

  let currentFile = '';
  const fileLine = /^([^\s].*\.css)\s*$/;
  const issueLine =
    /Expected selector "([^"]+)" to come before selector "([^"]+)"(?:, at line (\d+))?\s+no-descending-specificity/i;

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    const fileMatch = trimmed.match(fileLine);
    if (
      fileMatch &&
      !trimmed.includes('✖') &&
      !trimmed.includes('Expected selector') &&
      !trimmed.includes('Too many declarations')
    ) {
      currentFile = fileMatch[1]!.trim().replace(/\\/g, '/');
      continue;
    }

    const m = line.match(issueLine);
    if (m && currentFile) {
      issues.push({
        file: currentFile,
        moveSelector: m[1]!,
        beforeSelector: m[2]!,
        line: m[3] ? Number(m[3]) : undefined,
      });
    }
  }

  return issues;
}

/** Parse declaration-block-single-line-max-declarations issues. */
export function parseSingleLineMaxDeclarationIssues(
  lintOutput: string,
): SingleLineMaxDeclarationsIssue[] {
  const text = stripAnsi(lintOutput);
  const issues: SingleLineMaxDeclarationsIssue[] = [];
  const lines = text.split(/\r?\n/);
  let currentFile = '';
  const fileLine = /^([^\s].*\.css)\s*$/;
  const issueLine =
    /(\d+)\s*:\s*(\d+)\s+.*Too many declarations.*declaration-block-single-line-max-declarations/i;

  for (const raw of lines) {
    const trimmed = raw.trim();
    const fileMatch = trimmed.match(fileLine);
    if (
      fileMatch &&
      !trimmed.includes('✖') &&
      !trimmed.includes('Too many') &&
      !trimmed.includes('Expected selector')
    ) {
      currentFile = fileMatch[1]!.trim().replace(/\\/g, '/');
      continue;
    }
    const m = raw.match(issueLine);
    if (m && currentFile) {
      issues.push({
        file: currentFile,
        line: Number(m[1]),
        column: Number(m[2]),
      });
    }
  }
  return issues;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSelector(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

function matchBlockEnd(css: string, openBraceIndex: number): number {
  let depth = 0;
  for (let i = openBraceIndex; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Find a CSS rule block that includes `selector` (exact match in the selector list).
 * Whitespace between selector tokens is flexible.
 */
export function findRuleRange(
  css: string,
  selector: string,
): { start: number; end: number; text: string } | null {
  const normalized = normalizeSelector(selector);
  const flex = escapeRegExp(normalized).replace(/\\ /g, '\\s+');
  // Match the selector as a full entry in a selector list before `{`
  const re = new RegExp(`(^|[{},\\s])(${flex})(?=\\s*[,{])`, 'gi');

  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    const selStart = match.index + match[1]!.length;
    // Walk forward to the `{` that opens this rule (skip other selectors in the list)
    let brace = -1;
    let depthParen = 0;
    for (let i = selStart; i < css.length; i++) {
      const ch = css[i]!;
      if (ch === '(') depthParen++;
      else if (ch === ')') depthParen = Math.max(0, depthParen - 1);
      else if (ch === '{' && depthParen === 0) {
        brace = i;
        break;
      } else if (ch === '}' && depthParen === 0) {
        break;
      }
    }
    if (brace < 0) continue;

    const selectorChunk = css.slice(
      (() => {
        // Find start of this rule's selector list (after previous } or start)
        let s = selStart;
        while (s > 0 && css[s - 1] !== '}' && css[s - 1] !== '{') s--;
        while (s < selStart && /\s/.test(css[s]!)) s++;
        return s;
      })(),
      brace,
    );
    const selectors = selectorChunk
      .split(',')
      .map((s) => normalizeSelector(s))
      .filter(Boolean);
    if (!selectors.includes(normalized)) continue;

    const blockEnd = matchBlockEnd(css, brace);
    if (blockEnd < 0) continue;

    let start = css.lastIndexOf('}', selStart);
    start = start < 0 ? 0 : start + 1;
    while (start < selStart && /\s/.test(css[start]!)) start++;
    // Include one leading newline if present for cleaner cuts
    if (start > 0 && css[start - 1] === '\n') {
      /* keep start at selector */
    }

    return {
      start,
      end: blockEnd + 1,
      text: css.slice(start, blockEnd + 1),
    };
  }
  return null;
}

/** Swap two adjacent rule blocks when line hints are available. */
export function swapRulesByLine(
  css: string,
  earlierLine: number,
  laterLine: number,
): string | null {
  if (!(earlierLine > 0 && laterLine > earlierLine)) return null;
  const lines = css.split(/\r?\n/);
  if (laterLine > lines.length) return null;

  // Convert 1-based lines to offsets
  const lineStarts: number[] = [0];
  for (let i = 0; i < lines.length; i++) {
    lineStarts.push(lineStarts[i]! + lines[i]!.length + 1);
  }

  const findRuleAtLine = (line: number): { start: number; end: number } | null => {
    const approx = lineStarts[line - 1] ?? 0;
    // Walk back to selector start
    let brace = css.indexOf('{', approx);
    if (brace < 0) return null;
    // If { is far, search near line
    const lineEnd = lineStarts[line] ?? css.length;
    if (brace > lineEnd + 200) {
      brace = css.indexOf('{', Math.max(0, approx - 50));
    }
    if (brace < 0) return null;
    let start = css.lastIndexOf('}', brace);
    start = start < 0 ? 0 : start + 1;
    while (start < brace && /\s/.test(css[start]!)) start++;
    const end = matchBlockEnd(css, brace);
    if (end < 0) return null;
    return { start, end: end + 1 };
  };

  const a = findRuleAtLine(earlierLine);
  const b = findRuleAtLine(laterLine);
  if (!a || !b) return null;
  if (a.start === b.start) return null;
  // Expect a then b in file order
  if (a.start > b.start) return null;

  const first = css.slice(a.start, a.end);
  const second = css.slice(b.start, b.end);
  const between = css.slice(a.end, b.start);
  return css.slice(0, a.start) + second + between + first + css.slice(b.end);
}

/**
 * When both selectors share one rule list, put `moveSelector` before `beforeSelector`.
 * Example: `main p em, main em {` → `main em, main p em {`
 */
export function reorderSelectorsInSameRule(
  css: string,
  moveSelector: string,
  beforeSelector: string,
): string | null {
  const move = normalizeSelector(moveSelector);
  const before = normalizeSelector(beforeSelector);
  const range = findRuleRange(css, move);
  if (!range) return null;

  const brace = css.indexOf('{', range.start);
  if (brace < 0 || brace >= range.end) return null;

  const listStart = range.start;
  const listRaw = css.slice(listStart, brace);
  // Preserve leading whitespace of the rule
  const leadingWs = listRaw.match(/^\s*/)?.[0] ?? '';
  const listBody = listRaw.slice(leadingWs.length);
  const parts = listBody.split(',').map((p) => p.trim()).filter(Boolean);
  const normParts = parts.map((p) => normalizeSelector(p));
  const iMove = normParts.indexOf(move);
  const iBefore = normParts.indexOf(before);
  if (iMove < 0 || iBefore < 0) return null;
  if (iMove < iBefore) return css; // already ordered

  const reordered = [...parts];
  const [extracted] = reordered.splice(iMove, 1);
  // after splice, before index may shift if move was before it — here move was after before
  const insertAt = reordered.findIndex((p) => normalizeSelector(p) === before);
  if (insertAt < 0) return null;
  reordered.splice(insertAt, 0, extracted!);

  const newList = leadingWs + reordered.join(',\n');
  const gap = /\s/.test(css[brace - 1] ?? '') ? '' : ' ';
  return css.slice(0, listStart) + newList + gap + css.slice(brace);
}

/**
 * Move the rule for `moveSelector` to immediately before the rule for `beforeSelector`.
 * Also handles the common case where both appear in the same comma-separated selector list.
 */
export function reorderDescendingSpecificity(
  css: string,
  moveSelector: string,
  beforeSelector: string,
  earlierLine?: number,
): string | null {
  if (normalizeSelector(moveSelector) === normalizeSelector(beforeSelector)) return null;

  const move = findRuleRange(css, moveSelector);
  const before = findRuleRange(css, beforeSelector);

  if (move && before) {
    // Same rule block — reorder the selector list (stylelint no-descending-specificity)
    if (move.start === before.start) {
      return reorderSelectorsInSameRule(css, moveSelector, beforeSelector);
    }
    if (move.start < before.start) return css; // already ordered

    let next = css.slice(0, move.start) + css.slice(move.end);
    const beforeAgain = findRuleRange(next, beforeSelector);
    if (!beforeAgain) return null;
    const insert = `${move.text.trim()}\n\n`;
    return next.slice(0, beforeAgain.start) + insert + next.slice(beforeAgain.start);
  }

  // Fallback: swap by line when stylelint reported the earlier selector line
  if (earlierLine && earlierLine > 0) {
    const swapped = swapRulesByLine(css, earlierLine, earlierLine + 1);
    if (swapped) return swapped;
  }

  // Last resort: try same-rule reorder even if findRuleRange only found one
  return reorderSelectorsInSameRule(css, moveSelector, beforeSelector);
}

/**
 * Expand single-line declaration blocks that contain multiple declarations.
 * Fixes declaration-block-single-line-max-declarations (max 1).
 */
export function expandSingleLineDeclarationBlocks(css: string): string {
  // Match `{ decl; decl; ... }` on one line (no newline between braces)
  return css.replace(/\{([^{}\n]+)\}/g, (full, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return full;
    // Split on semicolons; if more than one non-empty decl, expand
    const decls = trimmed
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean);
    if (decls.length <= 1) return full;
    const inner = decls.map((d) => `  ${d};`).join('\n');
    return `{\n${inner}\n}`;
  });
}

export interface StylelintAutofixResult {
  fixedFiles: string[];
  remainingIssues: Array<DescendingSpecificityIssue | SingleLineMaxDeclarationsIssue | { file: string; note: string }>;
  notes: string[];
}

/**
 * Apply residual stylelint auto-fixes in `workDir` based on lint CLI output.
 */
export async function applyStylelintResidualFixes(
  workDir: string,
  lintOutput: string,
  readFileFn: (path: string) => Promise<string>,
  writeFileFn: (path: string, content: string) => Promise<void>,
  resolvePath: (rel: string) => string = (rel) => `${workDir.replace(/[/\\]$/, '')}/${rel}`,
): Promise<StylelintAutofixResult> {
  const descending = parseDescendingSpecificityIssues(lintOutput);
  const singleLine = parseSingleLineMaxDeclarationIssues(lintOutput);
  const fixedFiles: string[] = [];
  const remaining: StylelintAutofixResult['remainingIssues'] = [];
  const notes: string[] = [];

  const filesTouched = new Set<string>([
    ...descending.map((i) => i.file),
    ...singleLine.map((i) => i.file),
  ]);

  // Also expand single-line blocks in any CSS path mentioned even without parse hit
  const mentionedCss = stripAnsi(lintOutput).match(/(?:^|\n)([^\s].*\.css)\s*(?:\n|$)/g);
  if (mentionedCss) {
    for (const m of mentionedCss) {
      const f = m.trim().replace(/\\/g, '/');
      if (f.endsWith('.css')) filesTouched.add(f);
    }
  }

  for (const relPath of filesTouched) {
    const abs = resolvePath(relPath);
    let css: string;
    try {
      css = await readFileFn(abs);
    } catch {
      notes.push(`Could not read ${relPath} for stylelint auto-fix`);
      for (const issue of descending.filter((i) => i.file === relPath)) remaining.push(issue);
      continue;
    }

    let current = css;
    let changed = false;

    const beforeExpand = current;
    current = expandSingleLineDeclarationBlocks(current);
    if (current !== beforeExpand) {
      changed = true;
      notes.push(`Expanded single-line multi-declaration blocks in ${relPath}`);
    }

    for (const issue of descending.filter((i) => i.file === relPath)) {
      const next = reorderDescendingSpecificity(
        current,
        issue.moveSelector,
        issue.beforeSelector,
        issue.line,
      );
      if (!next) {
        remaining.push(issue);
        notes.push(
          `Could not reorder "${issue.moveSelector}" before "${issue.beforeSelector}" in ${relPath}`,
        );
        continue;
      }
      if (next !== current) {
        current = next;
        changed = true;
        notes.push(
          `Reordered "${issue.moveSelector}" before "${issue.beforeSelector}" in ${relPath}`,
        );
      }
    }

    if (changed) {
      await writeFileFn(abs, current);
      fixedFiles.push(relPath);
    }
  }

  return { fixedFiles, remainingIssues: remaining, notes };
}

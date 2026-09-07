// ============================================================
// @aeds/agent — EDS Developer Agent
// Builds block JS/CSS to resemble the captured reference UI
// ============================================================

import { RunStatus } from '@aeds/shared';
import { componentsForBlock, formatMcpComponentsForPrompt } from '@aeds/aem';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';
import type { ReferenceSnapshot } from '../reference-capture.js';

interface GeneratedBlock {
  name: string;
  js: string;
  css: string;
}

function fallbackBlock(name: string, snapshot?: ReferenceSnapshot): GeneratedBlock {
  const accent = snapshot?.cssExcerpt.match(/#[0-9a-fA-F]{3,8}/)?.[0] || '#0f1117';
  if (name === 'hero') {
    return {
      name,
      js: `export default function decorate(block) {
  const rows = [...block.children];
  const pictureRow = rows.find((row) => row.querySelector('picture, img'));
  const textRow = rows.find((row) => row.querySelector('h1, h2, p, a')) || rows[1];

  if (pictureRow) pictureRow.classList.add('hero-image-wrapper');
  if (textRow) {
    textRow.classList.add('hero-content');
    textRow.querySelectorAll('a').forEach((a) => a.classList.add('button', 'primary'));
  }
  block.dataset.aueType = 'component';
  block.dataset.aueModel = 'hero';
}
`,
      css: `.hero-wrapper { width: 100%; margin: 0; padding: 0; }
.hero {
  display: grid;
  grid-template-columns: 1fr;
  position: relative;
  overflow: hidden;
  background: ${accent};
  color: #fff;
}
@media (min-width: 900px) {
  .hero { grid-template-columns: 1fr 1fr; align-items: center; min-height: 520px; }
}
.hero .hero-content { padding: 40px 24px; z-index: 2; }
.hero .hero-image-wrapper img { width: 100%; height: 100%; object-fit: cover; display: block; }
`,
    };
  }

  return {
    name,
    js: `export default function decorate(block) {
  block.classList.add('${name}-block');
  block.dataset.aueType = 'component';
  block.dataset.aueModel = '${name}';
  [...block.children].forEach((row, index) => {
    row.classList.add('${name}-row');
    row.dataset.rowIndex = String(index);
  });
}
`,
    css: `.${name}-wrapper { width: 100%; }
.${name} { display: block; }
.${name} .${name}-row { margin: 0 0 1rem; }
`,
  };
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Soft-repair common LLM JSON mistakes before parse. */
function repairJsonCandidate(raw: string): string {
  let s = raw.trim();
  // Strip BOM / wrappers
  s = s.replace(/^\uFEFF/, '');
  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1');
  // Replace smart quotes
  s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  return s;
}

/**
 * Extract a JSON object from messy LLM output (markdown, prose, truncated braces).
 */
function extractJsonObject(text: string): unknown {
  const input = (text || '').trim();
  if (!input) throw new Error('LLM response was empty');

  const fenced = input.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [fenced?.[1]?.trim(), input].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const repaired = repairJsonCandidate(candidate);
    const direct = tryParseJson(repaired);
    if (direct) return direct;

    const start = repaired.indexOf('{');
    const end = repaired.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const sliced = repairJsonCandidate(repaired.slice(start, end + 1));
      const parsed = tryParseJson(sliced);
      if (parsed) return parsed;
    }
  }

  throw new Error('LLM response was not valid JSON');
}

/**
 * Fallback when the model returns markdown fences instead of JSON
 * (common with free / OpenAI-compatible proxies that ignore response_format).
 */
function extractBlockFromMarkdown(text: string, expectedName: string): GeneratedBlock | null {
  const jsFence =
    text.match(/```(?:javascript|js)\s*([\s\S]*?)```/i)?.[1]?.trim() ||
    text.match(/"js"\s*:\s*"((?:\\.|[^"\\])*)"/i)?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"');
  const cssFence =
    text.match(/```(?:css)\s*([\s\S]*?)```/i)?.[1]?.trim() ||
    text.match(/"css"\s*:\s*"((?:\\.|[^"\\])*)"/i)?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"');

  const nameMatch =
    text.match(/"name"\s*:\s*"([a-z0-9-]+)"/i)?.[1] ||
    text.match(/\bname\s*[:=]\s*["']?([a-z0-9-]+)/i)?.[1] ||
    expectedName;

  const js = (jsFence || '').trim();
  const css = (cssFence || '').trim();
  if (!js.includes('decorate') || !css) return null;

  return {
    name: String(nameMatch || expectedName)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') || expectedName,
    js,
    css,
  };
}

function parseBlockResponse(text: string, expectedName: string): GeneratedBlock | null {
  try {
    const parsed = parseGeneratedBlocks(extractJsonObject(text));
    const block = parsed.find((b) => b.name === expectedName) || parsed[0];
    if (block) return { ...block, name: expectedName };
  } catch {
    // fall through to markdown / field recovery
  }
  return extractBlockFromMarkdown(text, expectedName);
}

function parseGeneratedBlocks(payload: unknown): GeneratedBlock[] {
  if (!payload || typeof payload !== 'object') return [];
  const root = payload as { blocks?: unknown; name?: unknown; js?: unknown; css?: unknown };
  // Support both {"blocks":[...]} and a single {"name","js","css"} object
  if (!Array.isArray(root.blocks) && root.name && root.js && root.css) {
    return parseGeneratedBlocks({ blocks: [root] });
  }
  const blocks = root.blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks
    .map((b) => {
      if (!b || typeof b !== 'object') return null;
      const rec = b as Record<string, unknown>;
      const name = String(rec.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
      const js = String(rec.js || '');
      const css = String(rec.css || '');
      if (!name || !js.includes('decorate') || !css.trim()) return null;
      return { name, js, css };
    })
    .filter((b): b is GeneratedBlock => Boolean(b));
}

/** Keep prompts small so free/remote LLMs return quickly. */
const CHUNK_HTML_MAX = Number(process.env.LLM_CHUNK_HTML_CHARS || 4500);
const CHUNK_CSS_MAX = Number(process.env.LLM_CHUNK_CSS_CHARS || 1800);
const CHUNK_OUT_TOKENS = Math.min(Number(process.env.LLM_CHUNK_MAX_TOKENS || 2500), 4000);
/** Retries until a chunk returns parseable JSON (first chunk uses the higher count). */
const CHUNK_JSON_RETRIES = Math.max(1, Number(process.env.LLM_CHUNK_JSON_RETRIES || 6));
const CHUNK_JSON_RETRIES_FIRST = Math.max(
  CHUNK_JSON_RETRIES,
  Number(process.env.LLM_CHUNK_JSON_RETRIES_FIRST || 12),
);
const CHUNK_RETRY_DELAY_MS = Math.max(200, Number(process.env.LLM_CHUNK_RETRY_DELAY_MS || 1200));

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const BLOCK_HINTS: Record<string, string[]> = {
  hero: ['hero', 'banner', 'h1', 'picture', 'img', 'about us', 'contributor'],
  cards: ['card', 'contributor', 'grid', 'article', 'facebook', 'twitter', 'instagram'],
  columns: ['column', 'cols', 'grid', 'two-col', 'split'],
  teaser: ['teaser', 'promo', 'cta'],
  quote: ['blockquote', 'quote'],
  accordion: ['accordion', 'details', 'summary'],
  tabs: ['tab', 'tabs'],
  carousel: ['carousel', 'slider', 'swiper'],
};

function clip(text: string, max: number): string {
  if (!text || text.length <= max) return text || '';
  return `${text.slice(0, max)}\n/* …truncated… */`;
}

/** Pull the most relevant HTML slice for one block instead of the full page. */
function excerptForBlock(html: string, blockName: string, max = CHUNK_HTML_MAX): string {
  const hints = BLOCK_HINTS[blockName] || [blockName];
  const lower = html.toLowerCase();
  let bestIdx = -1;
  for (const hint of hints) {
    const idx = lower.indexOf(hint.toLowerCase());
    if (idx >= 0 && (bestIdx < 0 || idx < bestIdx)) bestIdx = idx;
  }
  if (bestIdx < 0) return clip(html, max);

  const start = Math.max(0, bestIdx - Math.floor(max * 0.2));
  return clip(html.slice(start, start + max), max);
}

function cssForBlock(css: string, blockName: string, max = CHUNK_CSS_MAX): string {
  if (!css.trim()) return '(none)';
  const hints = BLOCK_HINTS[blockName] || [blockName];
  const chunks: string[] = [];
  for (const hint of hints.slice(0, 4)) {
    const re = new RegExp(`[^{}]*${hint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{}]*\\{[^}]*\\}`, 'gi');
    const matches = css.match(re);
    if (matches) chunks.push(...matches.slice(0, 8));
  }
  if (chunks.length === 0) return clip(css, max);
  return clip(chunks.join('\n'), max);
}

export class EdsDeveloperAgent extends BaseAgent {
  public readonly id = 'agent-eds-developer';
  public readonly name = 'EDS Developer';
  public readonly description =
    'Generates EDS block JS/CSS that resembles the captured reference page UI';
  public readonly phase = RunStatus.IMPLEMENTING;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log('Generating EDS block implementations from reference UI/JS…');

    const blockNames = (context.detectedBlocks || ['hero', 'columns', 'cards']).filter(
      (b) =>
        !['header', 'footer', 'page-metadata', 'metadata', 'nav', 'navigation'].includes(b),
    );
    const snapshot = context.referenceSnapshot;
    const usedLlm = await this.tryGenerateWithLlm(context, blockNames, snapshot);

    if (!usedLlm) {
      context.log(
        snapshot?.ok
          ? 'LLM generation unavailable/failed — using reference-tinted fallback templates.'
          : 'No usable reference/LLM output — using structural fallback templates.',
        'warn',
      );
      for (const name of blockNames) {
        this.writeBlock(context, fallbackBlock(name, snapshot));
      }
    }

    const filesGenerated = Array.from(context.generatedFiles.keys()).filter((p) =>
      p.startsWith('blocks/'),
    );

    const decision = this.createDecision(
      context,
      'Implement EDS JS/CSS to resemble reference UI',
      [
        snapshot?.ok
          ? `Use captured reference from ${snapshot.finalUrl}`
          : 'Reference capture missing or incomplete',
        `Generate decorate() + scoped CSS for: ${blockNames.join(', ')}`,
        usedLlm ? 'LLM produced block files from reference excerpts' : 'Fallback templates applied',
      ],
      `Wrote ${filesGenerated.length} block asset(s) aiming for visual/structural resemblance to the reference.`,
    );

    return {
      success: true,
      decision,
      filesGenerated,
    };
  }

  private writeBlock(context: RunExecutionContext, block: GeneratedBlock): void {
    const jsPath = `blocks/${block.name}/${block.name}.js`;
    const cssPath = `blocks/${block.name}/${block.name}.css`;
    context.generatedFiles.set(jsPath, {
      path: jsPath,
      content: block.js.endsWith('\n') ? block.js : `${block.js}\n`,
      operation: 'create',
    });
    context.generatedFiles.set(cssPath, {
      path: cssPath,
      content: block.css.endsWith('\n') ? block.css : `${block.css}\n`,
      operation: 'create',
    });
  }

  private async tryGenerateWithLlm(
    context: RunExecutionContext,
    blockNames: string[],
    snapshot?: ReferenceSnapshot,
  ): Promise<boolean> {
    if (process.env.VITEST || process.env.NODE_ENV === 'test') return false;
    if (process.env.ENABLE_LLM_BLOCK_GEN === 'false') return false;
    if (!snapshot?.ok) return false;
    if (blockNames.length === 0) return false;

    const model = process.env.LLM_MODEL || undefined;
    context.log(
      `Asking LLM (${model || 'default'}) in ${blockNames.length} chunked call(s) — waiting for valid JSON per chunk (first chunk up to ${CHUNK_JSON_RETRIES_FIRST} attempts)…`,
    );

    let anyOk = false;
    for (let i = 0; i < blockNames.length; i++) {
      const name = blockNames[i]!;
      const isFirst = i === 0;
      try {
        const ok = await this.generateOneBlockChunk(
          context,
          name,
          snapshot,
          i + 1,
          blockNames.length,
          isFirst ? CHUNK_JSON_RETRIES_FIRST : CHUNK_JSON_RETRIES,
        );
        if (ok) {
          anyOk = true;
        } else if (isFirst) {
          // Do not continue to later chunks until the first returns valid JSON.
          context.log(
            `First chunk "${name}" never returned valid JSON after retries — stopping remaining chunks.`,
            'warn',
          );
          this.writeBlock(context, fallbackBlock(name, snapshot));
          for (const rest of blockNames.slice(1)) {
            this.writeBlock(context, fallbackBlock(rest, snapshot));
          }
          return false;
        } else {
          context.log(`Chunk for "${name}" failed after retries — writing fallback.`, 'warn');
          this.writeBlock(context, fallbackBlock(name, snapshot));
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        context.emit('llm.failed', {
          message: `LLM chunk failed for "${name}": ${message}`,
          error: message,
          blockNames: [name],
        });
        context.log(`LLM chunk failed for "${name}": ${message}`, 'warn');
        this.writeBlock(context, fallbackBlock(name, snapshot));
        if (isFirst) {
          for (const rest of blockNames.slice(1)) {
            this.writeBlock(context, fallbackBlock(rest, snapshot));
          }
          return false;
        }
      }
    }

    if (anyOk) {
      context.log(`Wrote ${blockNames.length} block(s) via chunked LLM generation.`);
    }
    return anyOk;
  }

  private async generateOneBlockChunk(
    context: RunExecutionContext,
    blockName: string,
    snapshot: ReferenceSnapshot,
    chunkIndex: number,
    chunkTotal: number,
    maxAttempts = CHUNK_JSON_RETRIES,
  ): Promise<boolean> {
    const model = process.env.LLM_MODEL || undefined;

    const hasStructured = Boolean(snapshot.jcr?.ok && snapshot.jcr.components.length > 0);
    const sourceLabel =
      snapshot.contentSource === 'mcp' ? 'MCP' : snapshot.contentSource === 'jcr' ? 'JCR' : 'HTML';

    const systemContent = [
      'You are an AEM Edge Delivery Services (Franklin) block engineer.',
      hasStructured
        ? 'Input is AEM MCP/JCR page content (componentType + properties), NOT scraped HTML.'
        : 'Produce ONE EDS block from HTML/CSS hints of a reference page.',
      'Skip any page/container/layout shells if present.',
      'Rules:',
      '- Vanilla ES module only: export default function decorate(block) { ... }',
      '- CSS scoped to the block class, mobile-first, no frameworks.',
      `- Block name must be exactly: ${blockName}`,
      '- Map authored properties into DOM (titles, text, fragment refs as card cells).',
      '- Keep JS under ~40 lines and CSS under ~60 lines.',
      '- Reply with ONLY a single JSON object. No markdown. No prose.',
      `- Exact shape: {"name":"${blockName}","js":"export default function decorate(block) {\\n  ...\\n}","css":".${blockName} { ... }"}`,
      '- Escape newlines inside js/css strings as \\n. Do not wrap in ``` fences.',
    ].join('\n');

    const jcrComponents = hasStructured
      ? componentsForBlock(snapshot.jcr!.components, blockName)
      : [];
    const mcpPrompt =
      jcrComponents.length > 0
        ? formatMcpComponentsForPrompt(jcrComponents, 5500)
        : '(no MCP/JCR nodes matched this block — use HTML excerpt)';

    const blockGuidance: Record<string, string> = {
      hero: 'Generate EDS block "hero": H1 from page/title components; optional supporting H2.',
      columns: 'Generate EDS block "columns" that renders richtext/intro text components.',
      cards:
        'Each experiencefragment is one card. Use the last path segment before /master as the person slug/name (e.g. stacey-roswells → "Stacey Roswells"). Build a responsive cards grid.',
    };

    // When MCP/JCR is present, do NOT send HTML scrape (design-doc rule)
    const htmlHint = hasStructured
      ? ''
      : excerptForBlock(snapshot.htmlExcerpt, blockName, CHUNK_HTML_MAX);
    const cssChunk = hasStructured
      ? ''
      : cssForBlock(snapshot.cssExcerpt, blockName, CHUNK_CSS_MAX);

    const baseUserContent = [
      `Chunk ${chunkIndex}/${chunkTotal} — block: ${blockName}`,
      `Page: ${snapshot.jcr?.pagePath || snapshot.finalUrl}`,
      `Title: ${snapshot.title}`,
      `Structured source: ${sourceLabel}`,
      '',
      blockGuidance[blockName] || `Generate EDS block "${blockName}" from the components below.`,
      `Return ONLY: {"name":"${blockName}","js":"...","css":"..."}`,
      '',
      '--- AEM MCP COMPONENTS (source of truth) ---',
      mcpPrompt,
      ...(hasStructured
        ? []
        : [
            '',
            '--- HTML hint (secondary) ---',
            htmlHint || '(none)',
            '',
            '--- CSS hint (secondary) ---',
            cssChunk || '(none)',
          ]),
    ]
      .filter((line) => line !== undefined)
      .join('\n');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const repairNudge =
        attempt === 1
          ? ''
          : [
              '',
              `RETRY ${attempt}/${maxAttempts}: Your previous reply was NOT valid JSON.`,
              'Output ONLY one JSON object. No markdown fences. No explanation.',
              `Start with { and end with }. Keys: name, js, css. name="${blockName}".`,
            ].join('\n');

      const messages = [
        { role: 'system' as const, content: systemContent },
        { role: 'user' as const, content: `${baseUserContent}${repairNudge}` },
      ];

      context.emit('llm.request', {
        message: `LLM chunk ${chunkIndex}/${chunkTotal} — block "${blockName}" attempt ${attempt}/${maxAttempts} (${sourceLabel} ${jcrComponents.length} node(s), ~${mcpPrompt.length + (htmlHint?.length || 0)} chars)`,
        model: model || 'default',
        blockNames: [blockName],
        chunkIndex,
        chunkTotal,
        attempt,
        maxAttempts,
        messages,
        temperature: Number(process.env.LLM_TEMPERATURE || 0.1),
        maxTokens: CHUNK_OUT_TOKENS,
        responseFormat: 'json',
      });

      context.log(
        `Waiting for valid JSON — chunk ${chunkIndex}/${chunkTotal} "${blockName}" attempt ${attempt}/${maxAttempts}…`,
      );

      let rawContent = '';
      let metrics: {
        model: string;
        latencyMs: number;
        inputTokens?: number;
        outputTokens?: number;
        estimatedCostUsd?: number;
      } = { model: model || 'default', latencyMs: 0 };

      try {
        const result = await context.llmGateway.executeChat(
          {
            model,
            temperature: Number(process.env.LLM_TEMPERATURE || 0.1),
            maxTokens: CHUNK_OUT_TOKENS,
            responseFormat: 'json',
            messages,
          },
          context.runId,
        );
        rawContent = result.response.content || '';
        metrics = result.metrics;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        context.emit('llm.failed', {
          message: `LLM chunk ${chunkIndex}/${chunkTotal} "${blockName}" attempt ${attempt}/${maxAttempts} request error: ${message}`,
          error: message,
          blockNames: [blockName],
          chunkIndex,
          chunkTotal,
          attempt,
        });
        context.log(`Attempt ${attempt}/${maxAttempts} request failed: ${message}`, 'warn');
        if (attempt < maxAttempts) {
          await sleep(CHUNK_RETRY_DELAY_MS * attempt);
          continue;
        }
        return false;
      }

      context.emit('llm.completed', {
        message: `LLM chunk ${chunkIndex}/${chunkTotal} raw response — ${blockName} attempt ${attempt}/${maxAttempts} (${metrics.latencyMs}ms, in=${metrics.inputTokens ?? 0} out=${metrics.outputTokens ?? 0})`,
        model: metrics.model,
        latencyMs: metrics.latencyMs,
        inputTokens: metrics.inputTokens,
        outputTokens: metrics.outputTokens,
        estimatedCostUsd: metrics.estimatedCostUsd,
        content: rawContent,
        blockNames: [blockName],
        chunkIndex,
        chunkTotal,
        attempt,
        maxAttempts,
      });

      // Also mirror into the plain console stream so the response is always visible
      // next to the request, even if structured event rendering is filtered.
      context.log(
        [
          `◀ LLM RESPONSE — ${blockName} attempt ${attempt}/${maxAttempts}`,
          `model=${metrics.model} · ${metrics.latencyMs}ms · in=${metrics.inputTokens ?? 0} out=${metrics.outputTokens ?? 0}`,
          '──── ASSISTANT ────',
          rawContent.trim() || '(empty response body)',
        ].join('\n'),
      );

      const block = parseBlockResponse(rawContent, blockName);
      if (block) {
        context.log(
          `Valid JSON received — chunk ${chunkIndex}/${chunkTotal} "${blockName}" on attempt ${attempt}/${maxAttempts} (${metrics.model}, ${metrics.latencyMs}ms)`,
        );
        this.writeBlock(context, { ...block, name: blockName });
        return true;
      }

      context.emit('llm.failed', {
        message: `LLM chunk ${chunkIndex}/${chunkTotal} "${blockName}" attempt ${attempt}/${maxAttempts} — invalid JSON, retrying…`,
        error: 'LLM response was not valid JSON',
        content: rawContent,
        blockNames: [blockName],
        chunkIndex,
        chunkTotal,
        attempt,
        maxAttempts,
      });
      context.log(
        `Invalid JSON for "${blockName}" attempt ${attempt}/${maxAttempts}. Raw (first 500c): ${rawContent.slice(0, 500)}`,
        'warn',
      );

      if (attempt < maxAttempts) {
        await sleep(CHUNK_RETRY_DELAY_MS * attempt);
      }
    }

    return false;
  }
}

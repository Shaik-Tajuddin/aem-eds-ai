// ============================================================
// @aeds/aem — Track B page parity job (MCP author + optional verify)
// Standalone: no PR / no new blocks required.
// ============================================================

import {
  getAuthorHtmlViaMcp,
  getExperimentalPageContent,
  putExperimentalPageContent,
  resolveExperimentalPageId,
  toAuthorContentPath,
} from './mcp-write.js';

export type ParityPhaseStatus = 'PASS' | 'FAIL' | 'SKIPPED' | 'UNAVAILABLE';

export interface ParityPhaseResult {
  action: string;
  status: ParityPhaseStatus;
  errorMessage?: string;
  detail?: Record<string, unknown>;
}

export interface PageParityInput {
  authorUrl: string;
  /** Reference page path or URL */
  referencePath: string;
  /** Destination authoring path or URL */
  targetPath: string;
  /** Git branch for ?ref= preview (existing or PR head) */
  branch?: string;
  /** Explicit Franklin tree to PUT; if omitted, copies reference content body onto target */
  contentTree?: unknown;
  /** JSON Patch ops instead of full PUT (requires contentTree unused) */
  patch?: unknown;
  /** When true, records css-fix as SKIPPED (no automated file rewrite in this package) */
  fixCss?: boolean;
  /** Attempt Playwright audit when @aeds/browser is available */
  verifyBrowser?: boolean;
  /** Optional absolute URLs override for browser/HTML verify */
  referenceUrl?: string;
  targetUrl?: string;
  accessToken?: string;
  mcpUrl?: string;
}

export interface PageParityResult {
  ok: boolean;
  referencePageId?: string;
  targetPageId?: string;
  referencePath: string;
  targetPath: string;
  branch?: string;
  referenceUrl?: string;
  targetUrl?: string;
  phases: ParityPhaseResult[];
  writeEtag?: string;
  error?: string;
}

function buildPageHtmlUrl(authorUrl: string, contentPath: string, branch?: string): string {
  const base = authorUrl.replace(/\/$/, '');
  const path = toAuthorContentPath(contentPath);
  const ref = branch ? `?ref=${encodeURIComponent(branch)}` : '?wcmmode=disabled';
  return `${base}${path}.html${ref}`;
}

function summarizeTree(body: unknown): { componentType?: string; itemCount?: number } {
  if (!body || typeof body !== 'object') return {};
  const b = body as Record<string, unknown>;
  const items = Array.isArray(b.items) ? b.items : [];
  return {
    componentType: typeof b.componentType === 'string' ? b.componentType : undefined,
    itemCount: items.length,
  };
}

/**
 * Run Track B: resolve pages → read/diff → write-api → optional HTML/browser verify.
 */
export async function runPageParity(input: PageParityInput): Promise<PageParityResult> {
  const authorUrl = input.authorUrl.replace(/\/$/, '');
  const referencePath = toAuthorContentPath(input.referencePath);
  const targetPath = toAuthorContentPath(input.targetPath);
  const branch = input.branch?.trim() || undefined;
  const phases: ParityPhaseResult[] = [];

  const referenceUrl =
    input.referenceUrl ||
    (referencePath ? buildPageHtmlUrl(authorUrl, referencePath, undefined).replace(/\?ref=[^&]+/, '?wcmmode=disabled') : undefined);
  const targetUrl =
    input.targetUrl || (targetPath ? buildPageHtmlUrl(authorUrl, targetPath, branch) : undefined);

  const result: PageParityResult = {
    ok: false,
    referencePath,
    targetPath,
    branch,
    referenceUrl,
    targetUrl,
    phases,
  };

  if (!authorUrl || !referencePath || !targetPath) {
    result.error = 'authorUrl, referencePath, and targetPath are required';
    phases.push({ action: 'validate-input', status: 'FAIL', errorMessage: result.error });
    return result;
  }

  // ── Resolve page IDs ──────────────────────────────────────
  const refIdRes = await resolveExperimentalPageId({
    aemUrl: authorUrl,
    authorPath: referencePath,
    accessToken: input.accessToken,
    mcpUrl: input.mcpUrl,
  });
  if (!refIdRes.ok || !refIdRes.pageId) {
    phases.push({
      action: 'resolve-reference',
      status: 'FAIL',
      errorMessage: refIdRes.error || 'Failed to resolve reference pageId',
    });
    result.error = refIdRes.error;
    return result;
  }
  result.referencePageId = refIdRes.pageId;
  phases.push({
    action: 'resolve-reference',
    status: 'PASS',
    detail: { pageId: refIdRes.pageId },
  });

  const destIdRes = await resolveExperimentalPageId({
    aemUrl: authorUrl,
    authorPath: targetPath,
    accessToken: input.accessToken,
    mcpUrl: input.mcpUrl,
  });
  if (!destIdRes.ok || !destIdRes.pageId) {
    phases.push({
      action: 'resolve-target',
      status: 'FAIL',
      errorMessage: destIdRes.error || 'Failed to resolve target pageId',
    });
    result.error = destIdRes.error;
    return result;
  }
  result.targetPageId = destIdRes.pageId;
  phases.push({
    action: 'resolve-target',
    status: 'PASS',
    detail: { pageId: destIdRes.pageId },
  });

  // ── Read content trees ────────────────────────────────────
  const refContent = await getExperimentalPageContent({
    aemUrl: authorUrl,
    pageId: refIdRes.pageId,
    accessToken: input.accessToken,
    mcpUrl: input.mcpUrl,
  });
  if (!refContent.ok) {
    phases.push({
      action: 'read-reference',
      status: 'FAIL',
      errorMessage: refContent.error,
    });
    result.error = refContent.error;
    return result;
  }
  phases.push({
    action: 'read-reference',
    status: 'PASS',
    detail: summarizeTree(refContent.body),
  });

  const destContent = await getExperimentalPageContent({
    aemUrl: authorUrl,
    pageId: destIdRes.pageId,
    accessToken: input.accessToken,
    mcpUrl: input.mcpUrl,
  });
  if (!destContent.ok || !destContent.etag) {
    phases.push({
      action: 'read-target',
      status: 'FAIL',
      errorMessage: destContent.error || 'Missing ETag on target content',
    });
    result.error = destContent.error || 'Missing ETag';
    return result;
  }
  phases.push({
    action: 'read-target',
    status: 'PASS',
    detail: { ...summarizeTree(destContent.body), etag: destContent.etag },
  });

  // ── Write ─────────────────────────────────────────────────
  const treeToWrite = input.contentTree ?? refContent.body;
  if (input.patch) {
    const { patchExperimentalPageContent } = await import('./mcp-write.js');
    const patchRes = await patchExperimentalPageContent({
      aemUrl: authorUrl,
      pageId: destIdRes.pageId,
      patch: input.patch,
      etag: destContent.etag,
      accessToken: input.accessToken,
      mcpUrl: input.mcpUrl,
    });
    if (!patchRes.ok) {
      phases.push({
        action: 'write-api',
        status: 'FAIL',
        errorMessage: patchRes.error,
      });
      result.error = patchRes.error;
      return result;
    }
    result.writeEtag = patchRes.etag;
    phases.push({
      action: 'write-api',
      status: 'PASS',
      detail: { mode: 'patch', status: patchRes.status, etag: patchRes.etag },
    });
  } else {
    if (treeToWrite === undefined || treeToWrite === null) {
      phases.push({
        action: 'write-api',
        status: 'FAIL',
        errorMessage: 'No contentTree and reference body empty',
      });
      result.error = 'Nothing to write';
      return result;
    }

    const putRes = await putExperimentalPageContent({
      aemUrl: authorUrl,
      pageId: destIdRes.pageId,
      content: treeToWrite,
      etag: destContent.etag,
      accessToken: input.accessToken,
      mcpUrl: input.mcpUrl,
    });
    if (!putRes.ok) {
      phases.push({
        action: 'write-api',
        status: 'FAIL',
        errorMessage: putRes.error,
      });
      result.error = putRes.error;
      return result;
    }
    result.writeEtag = putRes.etag;
    phases.push({
      action: 'write-api',
      status: 'PASS',
      detail: {
        mode: input.contentTree ? 'put-explicit' : 'put-copy-reference',
        status: putRes.status,
        etag: putRes.etag,
      },
    });
  }

  // ── Verify HTML via MCP ───────────────────────────────────
  if (targetUrl) {
    let pathForGet = targetUrl;
    try {
      const u = new URL(targetUrl);
      pathForGet = u.pathname + u.search;
    } catch {
      // keep
    }
    const htmlRes = await getAuthorHtmlViaMcp({
      aemUrl: authorUrl,
      pathOrUrl: pathForGet,
      accessToken: input.accessToken,
      mcpUrl: input.mcpUrl,
    });
    if (!htmlRes.ok) {
      phases.push({
        action: 'verify-html',
        status: 'UNAVAILABLE',
        errorMessage: htmlRes.error,
      });
    } else {
      const len = htmlRes.html?.length || 0;
      phases.push({
        action: 'verify-html',
        status: len > 100 ? 'PASS' : 'FAIL',
        errorMessage: len > 100 ? undefined : 'Rendered HTML too short',
        detail: { status: htmlRes.status, length: len },
      });
    }
  } else {
    phases.push({ action: 'verify-html', status: 'SKIPPED', errorMessage: 'No targetUrl' });
  }

  // ── Optional browser audit is performed by the API host (has @aeds/browser) ──
  if (input.verifyBrowser) {
    phases.push({
      action: 'browser-audit',
      status: 'SKIPPED',
      errorMessage: 'Deferred to API host BrowserController',
    });
  } else {
    phases.push({
      action: 'browser-audit',
      status: 'SKIPPED',
      errorMessage: 'verifyBrowser=false',
    });
  }

  // ── CSS fix (not automated in @aeds/aem) ──────────────────
  if (input.fixCss) {
    phases.push({
      action: 'css-fix',
      status: 'SKIPPED',
      errorMessage:
        'Automated CSS/JS rewrite is not performed by the API parity job; push block CSS on the branch or use Cursor browser subagent',
    });
  } else {
    phases.push({
      action: 'css-fix',
      status: 'SKIPPED',
      errorMessage: 'fixCss=false',
    });
  }

  const failed = phases.some((p) => p.status === 'FAIL');
  result.ok = !failed;
  if (failed && !result.error) {
    result.error = phases.find((p) => p.status === 'FAIL')?.errorMessage || 'Parity phase failed';
  }
  return result;
}

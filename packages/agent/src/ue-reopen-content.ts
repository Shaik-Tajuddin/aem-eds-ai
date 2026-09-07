// ============================================================
// UE reopen content verify — MCP/JCR re-read for persisted marker
// Never invents PASS; UNAVAILABLE when author/MCP credentials missing.
// ============================================================

export type ContentReopenStatus = 'PASS' | 'FAIL' | 'SKIPPED' | 'UNAVAILABLE';

export interface UeContentReopenResult {
  status: ContentReopenStatus;
  source?: 'mcp' | 'jcr' | 'none';
  summary: string;
  matchedIn?: string;
  /** How many string leaves were scanned (helps diagnose partial MCP trees). */
  scannedLeaves?: number;
}

/** Deep-walk nested objects/arrays and collect string leaves for marker search. */
export function collectStringLeaves(value: unknown, out: string[] = [], depth = 0): string[] {
  if (depth > 12) return out;
  if (typeof value === 'string') {
    if (value.trim()) out.push(value);
    return out;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    out.push(String(value));
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStringLeaves(item, out, depth + 1);
    return out;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Skip obvious binary/meta noise
      if (/^(jcr:uuid|jcr:primaryType|cq:lastReplicated)/i.test(k)) continue;
      collectStringLeaves(v, out, depth + 1);
    }
  }
  return out;
}

export function findMarkerInExport(
  marker: string,
  payload: unknown,
): { hit: boolean; scannedLeaves: number } {
  const leaves = collectStringLeaves(payload);
  const joined = leaves.join('\n');
  // Also scan full JSON in case values were nested oddly / truncated in leaves
  let json = '';
  try {
    json = JSON.stringify(payload);
  } catch {
    json = '';
  }
  const hit = joined.includes(marker) || json.includes(marker);
  return { hit, scannedLeaves: leaves.length };
}

/**
 * After UE save, re-fetch page content via MCP (preferred) or JCR and search for marker.
 * Requires AEM author URL / page content path context — otherwise UNAVAILABLE.
 * Partial MCP trees fall through to JCR before FAIL when possible.
 */
export async function verifyUeReopenViaContent(input: {
  marker: string;
  pageUrl?: string;
  authorUrl?: string;
  aemPageId?: string;
}): Promise<UeContentReopenResult> {
  const marker = input.marker?.trim();
  if (!marker) {
    return { status: 'SKIPPED', source: 'none', summary: 'Content reopen SKIPPED — no marker' };
  }

  const pageUrl =
    input.pageUrl ||
    process.env.UE_CONTENT_PAGE_URL ||
    process.env.AEM_DEFAULT_AUTHORING_PATH ||
    '';
  const authorUrl = input.authorUrl || process.env.AEM_AUTHOR_URL || undefined;

  if (!pageUrl || !/^https?:\/\//i.test(pageUrl)) {
    return {
      status: 'UNAVAILABLE',
      source: 'none',
      summary:
        'Content reopen UNAVAILABLE — set UE_CONTENT_PAGE_URL (or AEM authoring page URL) for MCP/JCR re-read',
    };
  }

  if (process.env.ENABLE_UE_CONTENT_VERIFY === 'false') {
    return {
      status: 'SKIPPED',
      source: 'none',
      summary: 'Content reopen SKIPPED — ENABLE_UE_CONTENT_VERIFY=false',
    };
  }

  try {
    const aem = await import('@aeds/aem');

    let mcpPartial = false;
    let mcpScanned = 0;

    // Prefer MCP when available
    try {
      const mcp = await aem.exportPageMcpComponents({
        pageUrl,
        authorUrl,
        pageId: input.aemPageId,
      });
      if (mcp.ok) {
        const { hit, scannedLeaves } = findMarkerInExport(marker, mcp);
        mcpScanned = scannedLeaves;
        if (hit) {
          return {
            status: 'PASS',
            source: 'mcp',
            summary: `MCP content reopen PASS — marker found (scanned ${scannedLeaves} leaves, ${mcp.components.length} component(s))`,
            matchedIn: mcp.pagePath,
            scannedLeaves,
          };
        }
        // Empty/partial tree → try JCR before declaring FAIL
        if (mcp.components.length === 0 || scannedLeaves < 3) {
          mcpPartial = true;
        } else if (!authorUrl) {
          return {
            status: 'FAIL',
            source: 'mcp',
            summary: `MCP content reopen FAIL — marker not found in ${mcp.components.length} component(s) / ${scannedLeaves} leaves (${mcp.pagePath})`,
            scannedLeaves,
          };
        } else {
          mcpPartial = true; // have author → always try JCR as second opinion
        }
      }
    } catch (mcpErr: unknown) {
      const msg = mcpErr instanceof Error ? mcpErr.message : String(mcpErr);
      if (!authorUrl) {
        return {
          status: 'UNAVAILABLE',
          source: 'mcp',
          summary: `MCP content reopen UNAVAILABLE — ${msg}`,
        };
      }
      mcpPartial = true;
    }

    const jcr = await aem.exportPageJcrComponents({
      pageUrl,
      authorUrl,
    });
    if (!jcr.ok) {
      if (mcpPartial) {
        return {
          status: 'UNAVAILABLE',
          source: 'jcr',
          summary: `Content reopen UNAVAILABLE — MCP tree partial/miss (${mcpScanned} leaves) and JCR failed: ${jcr.notes?.join('; ') || 'export failed'}`,
          scannedLeaves: mcpScanned,
        };
      }
      return {
        status: 'UNAVAILABLE',
        source: 'jcr',
        summary: `JCR content reopen UNAVAILABLE — ${jcr.notes?.join('; ') || 'export failed'}`,
      };
    }

    const { hit, scannedLeaves } = findMarkerInExport(marker, jcr);
    return {
      status: hit ? 'PASS' : 'FAIL',
      source: 'jcr',
      summary: hit
        ? `JCR content reopen PASS — marker found (scanned ${scannedLeaves} leaves, ${jcr.components.length} component(s))${mcpPartial ? ' after MCP miss/partial' : ''}`
        : `JCR content reopen FAIL — marker not found (scanned ${scannedLeaves} leaves, ${jcr.components.length} component(s)${mcpPartial ? '; MCP also missed' : ''})`,
      matchedIn: hit ? jcr.pagePath : undefined,
      scannedLeaves,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: 'UNAVAILABLE',
      source: 'none',
      summary: `Content reopen UNAVAILABLE — ${message}`,
    };
  }
}

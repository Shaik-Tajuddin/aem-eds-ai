// ============================================================
// @aeds/figma — URL Parser
// Parses fileKey and target nodeId from standard Figma URLs
// ============================================================

import { FigmaError, FigmaErrorCode } from './errors.js';

export interface ParsedFigmaUrl {
  fileKey: string;
  nodeId?: string;
  url: string;
}

export class FigmaUrlParser {
  /**
   * Parses a Figma URL into its component fileKey and optional nodeId
   */
  static parse(url: string): ParsedFigmaUrl {
    if (!url || typeof url !== 'string') {
      throw new FigmaError(
        'Figma URL must be a non-empty string',
        FigmaErrorCode.INVALID_URL
      );
    }

    try {
      const parsed = new URL(url.trim());
      if (!parsed.hostname.includes('figma.com')) {
        throw new FigmaError(
          `Invalid Figma domain in URL: ${url}. Expected a figma.com URL.`,
          FigmaErrorCode.INVALID_URL
        );
      }

      // Format: /file/:fileKey/... or /design/:fileKey/...
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const fileIndex = pathParts.findIndex((p) => p === 'file' || p === 'design');

      if (fileIndex === -1 || !pathParts[fileIndex + 1]) {
        throw new FigmaError(
          `Could not extract fileKey from Figma URL: ${url}`,
          FigmaErrorCode.INVALID_URL
        );
      }

      const fileKey = pathParts[fileIndex + 1]!;

      // Check query params for node-id (e.g. ?node-id=1:2 or ?node-id=1-2)
      let nodeId: string | undefined =
        parsed.searchParams.get('node-id') ||
        parsed.searchParams.get('node_id') ||
        undefined;

      if (nodeId) {
        // Figma sometimes encodes node ID as 1-2 instead of 1:2
        nodeId = nodeId.replace('-', ':');
      }

      return {
        fileKey,
        nodeId,
        url,
      };
    } catch (err: any) {
      if (err instanceof FigmaError) throw err;
      throw new FigmaError(
        `Failed to parse Figma URL: ${err?.message || err}`,
        FigmaErrorCode.INVALID_URL,
        undefined,
        err
      );
    }
  }
}

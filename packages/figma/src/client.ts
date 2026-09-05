// ============================================================
// @aeds/figma — Figma REST Client
// Interacts with official Figma REST API v1
// ============================================================

import { FigmaError, FigmaErrorCode } from './errors.js';
import type { FigmaClientConfig, FigmaFileResponse, FigmaNode } from './types.js';

export class FigmaClient {
  private readonly accessToken: string;
  private readonly apiUrl: string;
  private readonly timeoutMs: number;

  constructor(config: FigmaClientConfig) {
    if (!config?.accessToken || config.accessToken.trim() === '') {
      throw new FigmaError(
        'Figma Personal Access Token is required. Set FIGMA_ACCESS_TOKEN in project configuration.',
        FigmaErrorCode.AUTHENTICATION_REQUIRED
      );
    }

    this.accessToken = config.accessToken.trim();
    this.apiUrl = (config.apiUrl ?? 'https://api.figma.com').replace(/\/$/, '');
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        headers: {
          'X-Figma-Token': this.accessToken,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        throw new FigmaError(
          'Invalid or expired Figma access token. Authentication rejected.',
          FigmaErrorCode.AUTHENTICATION_REQUIRED,
          res.status
        );
      }

      if (res.status === 404) {
        throw new FigmaError(
          `Figma resource not found at ${endpoint}`,
          FigmaErrorCode.FILE_NOT_FOUND,
          404
        );
      }

      if (res.status === 429) {
        throw new FigmaError(
          'Figma API rate limit exceeded. Please retry later.',
          FigmaErrorCode.RATE_LIMITED,
          429
        );
      }

      if (!res.ok) {
        throw new FigmaError(
          `Figma API error: HTTP ${res.status} ${res.statusText}`,
          FigmaErrorCode.NETWORK_ERROR,
          res.status
        );
      }

      return (await res.json()) as T;
    } catch (err: any) {
      if (err instanceof FigmaError) throw err;
      if (err.name === 'AbortError') {
        throw new FigmaError(
          `Figma API request timed out after ${this.timeoutMs}ms`,
          FigmaErrorCode.NETWORK_ERROR,
          undefined,
          err
        );
      }
      throw new FigmaError(
        `Failed to connect to Figma API: ${err?.message || err}`,
        FigmaErrorCode.NETWORK_ERROR,
        undefined,
        err
      );
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Retrieves the JSON tree for an entire Figma file
   */
  async getFile(fileKey: string, depth?: number): Promise<FigmaFileResponse> {
    const query = depth ? `?depth=${depth}` : '';
    return this.request<FigmaFileResponse>(`/v1/files/${fileKey}${query}`);
  }

  /**
   * Retrieves specific subnodes from a Figma file
   */
  async getFileNodes(
    fileKey: string,
    nodeIds: string[]
  ): Promise<Record<string, { document: FigmaNode }>> {
    const ids = nodeIds.join(',');
    const res = await this.request<{ nodes: Record<string, { document: FigmaNode }> }>(
      `/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(ids)}`
    );
    return res.nodes || {};
  }

  /**
   * Generates rendered image export URLs for specified nodes
   */
  async getImageUrls(
    fileKey: string,
    nodeIds: string[],
    format: 'svg' | 'png' | 'jpg' = 'png',
    scale = 2
  ): Promise<Record<string, string>> {
    const ids = nodeIds.join(',');
    const endpoint = `/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=${format}&scale=${scale}`;
    const res = await this.request<{ images: Record<string, string> }>(endpoint);
    return res.images || {};
  }
}

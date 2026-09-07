// ============================================================
// @aeds/aem — AEM Cloud Client
// Connects to Adobe Experience Manager Author & Preview APIs
// ============================================================

import { AemError, AemErrorCode } from './errors.js';
import type {
  AemClientConfig,
  PublishResult,
  ContentFragmentData,
} from './types.js';
import { resolveAemAccessToken } from './ims-auth.js';

export class AemCloudClient {
  private readonly config: AemClientConfig;
  private token?: string;

  constructor(config: AemClientConfig) {
    if (!config.authorUrl) {
      throw new AemError(
        'AEM Author URL is required',
        AemErrorCode.AUTHENTICATION_REQUIRED
      );
    }
    this.config = config;
    this.token = config.bearerToken;
  }

  /**
   * Retrieves an authorization header. Fails loudly per Product Vision §75 if unconfigured.
   */
  private async getAuthHeader(): Promise<string> {
    if (this.token) {
      return `Bearer ${this.token}`;
    }

    if (this.config.imsConfig) {
      const { clientId, clientSecret, technicalAccountId, orgId, privateKey } = this.config.imsConfig;
      if (!clientId || !clientSecret || !technicalAccountId || !orgId || !privateKey) {
        throw new AemError(
          'Incomplete AEM IMS credentials provided. Valid clientId, clientSecret, technicalAccountId, orgId, and privateKey are required.',
          AemErrorCode.AUTHENTICATION_REQUIRED
        );
      }
      const { exchangeImsJwt } = await import('./ims-auth.js');
      const token = await exchangeImsJwt(this.config.imsConfig);
      this.token = token.accessToken;
      return `Bearer ${this.token}`;
    }

    const fromEnv = await resolveAemAccessToken();
    if (fromEnv?.accessToken) {
      this.token = fromEnv.accessToken;
      return `Bearer ${this.token}`;
    }

    throw new AemError(
      'AEM authentication credentials missing. Configure AEM_BEARER_TOKEN or AEM IMS Service Credentials in project settings.',
      AemErrorCode.AUTHENTICATION_REQUIRED
    );
  }

  /**
   * Dispatches preview update for an EDS page
   */
  async previewPage(path: string): Promise<PublishResult> {
    const authHeader = await this.getAuthHeader();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const endpoint = this.config.previewUrl
      ? `${this.config.previewUrl.replace(/\/$/, '')}${cleanPath}`
      : `${this.config.authorUrl.replace(/\/$/, '')}/api/v1/preview${cleanPath}`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new AemError(
          `Failed to preview page at ${path}: HTTP ${res.status} ${res.statusText}`,
          AemErrorCode.PREVIEW_FAILED,
          res.status
        );
      }

      return {
        path: cleanPath,
        published: true,
        publishedAt: new Date().toISOString(),
        environment: 'preview',
        status: res.status,
      };
    } catch (err: any) {
      if (err instanceof AemError) throw err;
      throw new AemError(
        `Network failure previewing page ${path}: ${err?.message || err}`,
        AemErrorCode.NETWORK_ERROR,
        undefined,
        err
      );
    }
  }

  /**
   * Replicates or publishes an approved EDS page to live
   */
  async publishPage(path: string): Promise<PublishResult> {
    const authHeader = await this.getAuthHeader();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const endpoint = `${this.config.authorUrl.replace(/\/$/, '')}/bin/replicate.json`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          cmd: 'Activate',
          path: cleanPath,
        }),
      });

      if (!res.ok) {
        throw new AemError(
          `Failed to publish page ${path} to live: HTTP ${res.status} ${res.statusText}`,
          AemErrorCode.PUBLISH_FAILED,
          res.status
        );
      }

      return {
        path: cleanPath,
        published: true,
        publishedAt: new Date().toISOString(),
        environment: 'live',
        status: res.status,
      };
    } catch (err: any) {
      if (err instanceof AemError) throw err;
      throw new AemError(
        `Failed to publish page ${path}: ${err?.message || err}`,
        AemErrorCode.NETWORK_ERROR,
        undefined,
        err
      );
    }
  }

  /**
   * Fetches Content Fragment elements via AEM Assets REST API
   */
  async getContentFragment(path: string): Promise<ContentFragmentData> {
    const authHeader = await this.getAuthHeader();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const endpoint = `${this.config.authorUrl.replace(/\/$/, '')}/api/assets${cleanPath}.json`;

    try {
      const res = await fetch(endpoint, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });

      if (res.status === 404) {
        throw new AemError(
          `Content Fragment not found at ${path}`,
          AemErrorCode.CONTENT_FRAGMENT_NOT_FOUND,
          404
        );
      }

      if (!res.ok) {
        throw new AemError(
          `AEM API error fetching Content Fragment ${path}: HTTP ${res.status}`,
          AemErrorCode.NETWORK_ERROR,
          res.status
        );
      }

      const json = (await res.json()) as any;
      const properties = json.properties || {};
      const elements: Record<string, { value: unknown; dataType: string }> = {};

      if (properties.elements) {
        for (const [key, val] of Object.entries(properties.elements) as [string, any][]) {
          elements[key] = {
            value: val.value,
            dataType: val.dataType ?? 'string',
          };
        }
      }

      return {
        id: properties.id ?? path.split('/').pop() ?? 'fragment',
        title: properties.title ?? path,
        model: properties.model ?? 'default',
        path: cleanPath,
        elements,
      };
    } catch (err: any) {
      if (err instanceof AemError) throw err;
      throw new AemError(
        `Error loading Content Fragment ${path}: ${err?.message || err}`,
        AemErrorCode.NETWORK_ERROR,
        undefined,
        err
      );
    }
  }
}

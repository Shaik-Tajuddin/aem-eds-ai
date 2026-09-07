// ============================================================
// @aeds/aem — Adobe Cloud Manager adapter (feature-flagged)
// Deployment state is separate from Git state.
// ============================================================

import { AemError, AemErrorCode } from './errors.js';

export interface CloudManagerProvider {
  getPrograms(): Promise<CloudManagerProgram[]>;
  getEnvironments(programId: string): Promise<CloudManagerEnvironment[]>;
  getPipelines(programId: string): Promise<CloudManagerPipeline[]>;
  startPipeline(programId: string, pipelineId: string): Promise<CloudManagerPipelineExecution>;
  getPipelineStatus(programId: string, pipelineId: string, executionId: string): Promise<CloudManagerPipelineExecution>;
}

export interface CloudManagerConfig {
  clientId?: string;
  clientSecret?: string;
  orgId?: string;
  apiBaseUrl?: string;
  enabled?: boolean;
}

export interface CloudManagerProgram {
  id: string;
  name: string;
  enabled: boolean;
}

export interface CloudManagerEnvironment {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface CloudManagerPipeline {
  id: string;
  name: string;
  status: string;
}

export interface CloudManagerPipelineExecution {
  id: string;
  pipelineId: string;
  status: 'NOT_STARTED' | 'RUNNING' | 'FINISHED' | 'ERROR' | 'CANCELLED' | 'UNKNOWN';
  startedAt?: string;
  finishedAt?: string;
  raw?: Record<string, unknown>;
}

function isEnabled(config?: CloudManagerConfig): boolean {
  if (config?.enabled === false) return false;
  if (process.env.ENABLE_CLOUD_MANAGER === 'true') return true;
  return Boolean(config?.enabled);
}

/**
 * Real HTTP adapter for Adobe Cloud Manager API.
 * Fails loudly when credentials/feature flag are missing — never fakes pipeline success.
 */
export class CloudManagerClient implements CloudManagerProvider {
  private readonly config: CloudManagerConfig;
  private token?: string;

  constructor(config: CloudManagerConfig = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || process.env.CLOUD_MANAGER_API_URL || 'https://cloudmanager.adobe.io',
      clientId: config.clientId || process.env.CLOUD_MANAGER_CLIENT_ID,
      clientSecret: config.clientSecret || process.env.CLOUD_MANAGER_CLIENT_SECRET,
      orgId: config.orgId || process.env.CLOUD_MANAGER_ORG_ID,
      enabled: config.enabled,
    };
  }

  public isConfigured(): boolean {
    return Boolean(
      isEnabled(this.config) &&
        this.config.clientId &&
        this.config.clientSecret &&
        this.config.orgId,
    );
  }

  private assertReady(): void {
    if (!isEnabled(this.config)) {
      throw new AemError(
        'Cloud Manager is disabled. Set ENABLE_CLOUD_MANAGER=true and credentials to use pipelines.',
        AemErrorCode.AUTHENTICATION_REQUIRED,
      );
    }
    if (!this.config.clientId || !this.config.clientSecret || !this.config.orgId) {
      throw new AemError(
        'Cloud Manager credentials missing (CLOUD_MANAGER_CLIENT_ID / _SECRET / _ORG_ID).',
        AemErrorCode.AUTHENTICATION_REQUIRED,
      );
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.token) return this.token;
    this.assertReady();

    const res = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
        scope: 'openid,AdobeID,read_organizations,additional_info.projectedProductContext',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new AemError(
        `Cloud Manager IMS token exchange failed: HTTP ${res.status} ${text}`,
        AemErrorCode.AUTHENTICATION_REQUIRED,
        res.status,
      );
    }

    const json = (await res.json()) as { access_token?: string };
    if (!json.access_token) {
      throw new AemError('Cloud Manager IMS response missing access_token', AemErrorCode.AUTHENTICATION_REQUIRED);
    }
    this.token = json.access_token;
    return this.token;
  }

  private async api<T>(path: string, init?: RequestInit): Promise<T> {
    this.assertReady();
    const token = await this.getAccessToken();
    const base = this.config.apiBaseUrl!.replace(/\/$/, '');
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': this.config.clientId!,
        'x-gw-ims-org-id': this.config.orgId!,
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new AemError(
        `Cloud Manager API error ${path}: HTTP ${res.status} ${text}`,
        AemErrorCode.NETWORK_ERROR,
        res.status,
      );
    }

    return (await res.json()) as T;
  }

  public async getPrograms(): Promise<CloudManagerProgram[]> {
    const data = await this.api<{ _embedded?: { programs?: any[] } }>('/api/programs');
    return (data._embedded?.programs || []).map((p) => ({
      id: String(p.id),
      name: String(p.name || p.id),
      enabled: Boolean(p.enabled ?? true),
    }));
  }

  public async getEnvironments(programId: string): Promise<CloudManagerEnvironment[]> {
    const data = await this.api<{ _embedded?: { environments?: any[] } }>(
      `/api/program/${programId}/environments`,
    );
    return (data._embedded?.environments || []).map((e) => ({
      id: String(e.id),
      name: String(e.name || e.id),
      type: String(e.type || 'unknown'),
      status: String(e.status || 'unknown'),
    }));
  }

  public async getPipelines(programId: string): Promise<CloudManagerPipeline[]> {
    const data = await this.api<{ _embedded?: { pipelines?: any[] } }>(
      `/api/program/${programId}/pipelines`,
    );
    return (data._embedded?.pipelines || []).map((p) => ({
      id: String(p.id),
      name: String(p.name || p.id),
      status: String(p.status || 'unknown'),
    }));
  }

  public async startPipeline(programId: string, pipelineId: string): Promise<CloudManagerPipelineExecution> {
    const data = await this.api<any>(`/api/program/${programId}/pipeline/${pipelineId}/execution`, {
      method: 'PUT',
    });
    return {
      id: String(data.id || data.executionId || 'unknown'),
      pipelineId,
      status: (data.status as CloudManagerPipelineExecution['status']) || 'RUNNING',
      startedAt: data.createdAt || new Date().toISOString(),
      raw: data,
    };
  }

  public async getPipelineStatus(
    programId: string,
    pipelineId: string,
    executionId: string,
  ): Promise<CloudManagerPipelineExecution> {
    const data = await this.api<any>(
      `/api/program/${programId}/pipeline/${pipelineId}/execution/${executionId}`,
    );
    return {
      id: String(data.id || executionId),
      pipelineId,
      status: (data.status as CloudManagerPipelineExecution['status']) || 'UNKNOWN',
      startedAt: data.createdAt,
      finishedAt: data.finishedAt,
      raw: data,
    };
  }
}

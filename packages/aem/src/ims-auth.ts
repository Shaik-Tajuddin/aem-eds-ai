// ============================================================
// @aeds/aem — Adobe IMS access-token helpers
// Supports AEM_BEARER_TOKEN, JWT service accounts, and OAuth S2S
// ============================================================

import { createSign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { AemError, AemErrorCode } from './errors.js';
import type { AemImsConfig } from './types.js';

export interface ImsTokenResult {
  accessToken: string;
  expiresAt: number;
  source: 'bearer_env' | 'jwt_exchange' | 'oauth_s2s';
}

let cached: ImsTokenResult | null = null;

function b64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function signRs256Jwt(payload: Record<string, unknown>, privateKeyPem: string): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const data = `${b64urlJson(header)}.${b64urlJson(payload)}`;
  const signer = createSign('RSA-SHA256');
  signer.update(data);
  signer.end();
  const signature = signer.sign(privateKeyPem).toString('base64url');
  return `${data}.${signature}`;
}

function readPrivateKey(pathOrPem: string): string {
  const trimmed = pathOrPem.trim();
  if (trimmed.includes('BEGIN') && trimmed.includes('PRIVATE KEY')) {
    return trimmed;
  }
  if (!existsSync(trimmed)) {
    throw new AemError(
      `AEM private key not found at AEM_PRIVATE_KEY_PATH=${trimmed}`,
      AemErrorCode.AUTHENTICATION_REQUIRED,
    );
  }
  return readFileSync(trimmed, 'utf8');
}

function defaultMetaScopes(): string[] {
  return [
    'https://ims-na1.adobelogin.com/s/ent_aem_cloud_api',
    'https://ims-na1.adobelogin.com/s/ent_aem_cloud',
  ];
}

/**
 * Exchange Adobe JWT service-account credentials for an IMS access token.
 */
export async function exchangeImsJwt(config: AemImsConfig): Promise<ImsTokenResult> {
  const imsHost = 'https://ims-na1.adobelogin.com';
  const now = Math.floor(Date.now() / 1000);
  const metaScopes = config.metaScopes?.length ? config.metaScopes : defaultMetaScopes();

  const payload: Record<string, unknown> = {
    exp: now + 60 * 5,
    iss: config.orgId,
    sub: config.technicalAccountId,
    aud: `${imsHost}/c/${config.clientId}`,
  };
  for (const scope of metaScopes) {
    payload[scope] = true;
  }

  const jwt = signRs256Jwt(payload, config.privateKey);
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    jwt_token: jwt,
  });

  const res = await fetch(`${imsHost}/ims/exchange/jwt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await res.text();
  let json: { access_token?: string; expires_in?: number; error?: string; error_description?: string } = {};
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    // keep raw
  }

  if (!res.ok || !json.access_token) {
    throw new AemError(
      `IMS JWT exchange failed HTTP ${res.status}: ${json.error_description || json.error || text.slice(0, 300)}`,
      AemErrorCode.AUTHENTICATION_REQUIRED,
      res.status,
    );
  }

  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 3600;
  return {
    accessToken: json.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
    source: 'jwt_exchange',
  };
}

/**
 * OAuth Server-to-Server (client credentials) — used by newer Adobe Developer Console projects.
 */
export async function exchangeImsOAuthS2S(input: {
  clientId: string;
  clientSecret: string;
  scopes?: string[];
}): Promise<ImsTokenResult> {
  const scopes =
    input.scopes?.join(',') ||
    'openid,AdobeID,read_organizations,additional_info.projectedProductContext,aem.cloud';

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: input.clientId,
    client_secret: input.clientSecret,
    scope: scopes,
  });

  const res = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await res.text();
  let json: { access_token?: string; expires_in?: number; error?: string; error_description?: string } = {};
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    // keep raw
  }

  if (!res.ok || !json.access_token) {
    throw new AemError(
      `IMS OAuth S2S failed HTTP ${res.status}: ${json.error_description || json.error || text.slice(0, 300)}`,
      AemErrorCode.AUTHENTICATION_REQUIRED,
      res.status,
    );
  }

  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 3600;
  return {
    accessToken: json.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
    source: 'oauth_s2s',
  };
}

export function imsConfigFromEnv(env: NodeJS.ProcessEnv = process.env): AemImsConfig | null {
  const clientId = env['AEM_CLIENT_ID']?.trim();
  const clientSecret = env['AEM_CLIENT_SECRET']?.trim();
  const orgId = env['AEM_ORGANIZATION_ID']?.trim();
  const technicalAccountId = env['AEM_TECHNICAL_ACCOUNT_ID']?.trim();
  const privateKeyPath = env['AEM_PRIVATE_KEY_PATH']?.trim();

  if (!clientId || !clientSecret || !orgId || !technicalAccountId || !privateKeyPath) {
    return null;
  }

  try {
    return {
      clientId,
      clientSecret,
      orgId,
      technicalAccountId,
      privateKey: readPrivateKey(privateKeyPath),
    };
  } catch {
    return null;
  }
}

/**
 * Resolve an IMS/AEM bearer token from env:
 * 1) AEM_BEARER_TOKEN
 * 2) JWT service account (AEM_CLIENT_* + private key)
 * 3) OAuth S2S (client id/secret only)
 */
export async function resolveAemAccessToken(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ImsTokenResult | null> {
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached;
  }

  const direct = env['AEM_BEARER_TOKEN']?.trim();
  if (direct) {
    cached = {
      accessToken: direct,
      expiresAt: Date.now() + 55 * 60_000,
      source: 'bearer_env',
    };
    return cached;
  }

  const jwtConfig = imsConfigFromEnv(env);
  if (jwtConfig) {
    try {
      cached = await exchangeImsJwt(jwtConfig);
      return cached;
    } catch (jwtErr) {
      // Fall through to OAuth S2S — some consoles no longer issue JWT credentials
      const clientId = env['AEM_CLIENT_ID']?.trim();
      const clientSecret = env['AEM_CLIENT_SECRET']?.trim();
      if (clientId && clientSecret) {
        try {
          cached = await exchangeImsOAuthS2S({ clientId, clientSecret });
          return cached;
        } catch {
          throw jwtErr instanceof Error ? jwtErr : new Error(String(jwtErr));
        }
      }
      throw jwtErr;
    }
  }

  const clientId = env['AEM_CLIENT_ID']?.trim();
  const clientSecret = env['AEM_CLIENT_SECRET']?.trim();
  if (clientId && clientSecret) {
    cached = await exchangeImsOAuthS2S({ clientId, clientSecret });
    return cached;
  }

  return null;
}

/** Test helper — clear cached token between tests */
export function clearImsTokenCache(): void {
  cached = null;
}

# AEM Integration

## Adapter

Package `@aeds/aem` — do not scatter AEM HTTP calls through the platform.

### `AemCloudClient`

- `previewPage`, `publishPage`, `getContentFragment`
- Auth: bearer token **or** IMS JWT (`ims-auth.ts`) **or** env resolution
- Fails loudly when credentials are incomplete

### Env

```bash
AEM_AUTHOR_URL=
AEM_CLIENT_ID=
AEM_CLIENT_SECRET=
AEM_ORG_ID=                 # alias of AEM_ORGANIZATION_ID
AEM_ORGANIZATION_ID=
AEM_TECHNICAL_ACCOUNT_ID=
AEM_PRIVATE_KEY_PATH=
AEM_DEFAULT_AUTHORING_PATH=/content/mysite/us/en
```

Authentication is **server-side only**. Distinguish:

1. AEM API authentication (service credentials)
2. Universal Editor browser user authentication

## Cloud Manager

`CloudManagerClient` implements `CloudManagerProvider`:

- `getPrograms` / `getEnvironments` / `getPipelines`
- `startPipeline` / `getPipelineStatus`

```bash
ENABLE_CLOUD_MANAGER=true
CLOUD_MANAGER_CLIENT_ID=
CLOUD_MANAGER_CLIENT_SECRET=
CLOUD_MANAGER_ORG_ID=
```

Disabled/unconfigured → explicit error (never fake SUCCESS).

## JCR export

`jcr-export.ts` produces structured page/component text for LLM context and strips sensitive binary properties.

## Feature flags

Live UE browser authoring and Cloud Manager pipelines remain feature-flagged until credentials and policy allow them.

// ============================================================
// Project wizard / create defaults from process.env
// ============================================================

function envString(key: string): string {
  return (process.env[key] || '').trim();
}

function envNum(key: string, fallback: number): number {
  const n = Number(process.env[key]);
  return Number.isFinite(n) ? n : fallback;
}

/** Treat unset / example placeholders as empty so they are not copied into projects. */
export function isEnvPlaceholder(value?: string): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  if (!v) return true;
  return (
    v.includes('your_') ||
    v.includes('_here') ||
    v.includes('xxxx') ||
    v === 'ghp_your_token_here' ||
    v.startsWith('sk-your')
  );
}

/** Map LLM_PROVIDER env values onto New Project Wizard select ids. */
export function mapLlmProviderToWizard(raw?: string): string {
  const v = (raw || '').trim().toLowerCase().replace(/_/g, '-');
  if (!v) return '';
  if (v === 'openai') return 'OPENAI';
  if (v === 'anthropic') return 'ANTHROPIC';
  if (v === 'gemini' || v === 'google' || v === 'google-gemini') return 'GOOGLE_GEMINI';
  if (v === 'azure' || v === 'azure-openai') return 'AZURE_OPENAI';
  if (v === 'ollama') return 'OLLAMA';
  if (v === 'custom' || v === 'openai-compatible') return 'CUSTOM';
  // Unknown providers (e.g. gateway names) use Custom so API URL / key fields show
  return 'CUSTOM';
}

export interface ProjectFormDefaults {
  githubBranch: string;
  githubToken: string;
  aemAuthorUrl: string;
  aemAuthoringPath: string;
  aemPreviewUrl: string;
  aemEnvironment: string;
  llmProvider: string;
  llmApiUrl: string;
  llmApiKey: string;
  llmModel: string;
  visualThreshold: number;
  accessibilityThreshold: number;
  performanceThreshold: number;
  maxFixIterations: number;
  maxRuntimeMinutes: number;
  maxToolCalls: number;
}

/**
 * Defaults for the New Project wizard and create-project fallbacks.
 * Secrets are included so local/dev can prefill encrypted project credentials.
 */
export function getProjectFormDefaultsFromEnv(): ProjectFormDefaults {
  const githubTokenRaw = envString('GITHUB_TOKEN');
  const llmApiKeyRaw =
    envString('LLM_API_KEY') ||
    envString('OPENAI_API_KEY') ||
    envString('ANTHROPIC_API_KEY') ||
    envString('AZURE_OPENAI_API_KEY');

  const authorUrl = envString('AEM_AUTHOR_URL').replace(/\/+$/, '');

  return {
    githubBranch: 'main',
    githubToken: isEnvPlaceholder(githubTokenRaw) ? '' : githubTokenRaw,
    aemAuthorUrl: authorUrl,
    aemAuthoringPath: envString('AEM_DEFAULT_AUTHORING_PATH'),
    aemPreviewUrl: '',
    aemEnvironment: '',
    llmProvider: mapLlmProviderToWizard(envString('LLM_PROVIDER')),
    llmApiUrl: envString('LLM_API_URL'),
    llmApiKey: isEnvPlaceholder(llmApiKeyRaw) ? '' : llmApiKeyRaw,
    llmModel: envString('LLM_MODEL'),
    visualThreshold: envNum('QG_VISUAL_THRESHOLD', 95),
    accessibilityThreshold: envNum('QG_ACCESSIBILITY_THRESHOLD', 95),
    performanceThreshold: envNum('QG_PERFORMANCE_THRESHOLD', 90),
    maxFixIterations: envNum('AGENT_MAX_FIX_ITERATIONS', 5),
    maxRuntimeMinutes: envNum('AGENT_MAX_RUNTIME_MINUTES', 30),
    maxToolCalls: envNum('AGENT_MAX_TOOL_CALLS', 250),
  };
}

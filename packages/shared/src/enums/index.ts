// ============================================================
// Agent Run Status Enum
// ============================================================
export enum RunStatus {
  RECEIVED = 'RECEIVED',
  ANALYZING = 'ANALYZING',
  PLANNING = 'PLANNING',
  IMPLEMENTING = 'IMPLEMENTING',
  BUILDING = 'BUILDING',
  DEPLOYING_PREVIEW = 'DEPLOYING_PREVIEW',
  UE_AUTHORING = 'UE_AUTHORING',
  FUNCTIONAL_TESTING = 'FUNCTIONAL_TESTING',
  VISUAL_VALIDATION = 'VISUAL_VALIDATION',
  ACCESSIBILITY = 'ACCESSIBILITY',
  PERFORMANCE = 'PERFORMANCE',
  DIAGNOSING = 'DIAGNOSING',
  FIXING = 'FIXING',
  REGRESSION_TESTING = 'REGRESSION_TESTING',
  QUALITY_GATE = 'QUALITY_GATE',
  PR_CREATED = 'PR_CREATED',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  DEPLOYED = 'DEPLOYED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  LIMIT_REACHED = 'LIMIT_REACHED',
}

// ============================================================
// Project Health
// ============================================================
export enum ProjectHealth {
  HEALTHY = 'HEALTHY',
  ISSUES = 'ISSUES',
  DEGRADED = 'DEGRADED',
  UNKNOWN = 'UNKNOWN',
}

// ============================================================
// Agent Event Types
// ============================================================
export enum AgentEventType {
  AGENT_STARTED = 'agent.started',
  AGENT_STEP_STARTED = 'agent.step.started',
  AGENT_STEP_COMPLETED = 'agent.step.completed',
  AGENT_COMPLETED = 'agent.completed',
  AGENT_FAILED = 'agent.failed',
  AGENT_PAUSED = 'agent.paused',
  AGENT_RESUMED = 'agent.resumed',
  AGENT_CANCELLED = 'agent.cancelled',
  AGENT_LIMIT_REACHED = 'agent.limit_reached',

  LLM_REQUEST = 'llm.request',
  LLM_COMPLETED = 'llm.completed',
  LLM_FAILED = 'llm.failed',

  TOOL_STARTED = 'tool.started',
  TOOL_COMPLETED = 'tool.completed',
  TOOL_FAILED = 'tool.failed',
  TOOL_DENIED = 'tool.denied',

  FILE_CHANGED = 'file.changed',
  BUILD_STARTED = 'build.started',
  BUILD_COMPLETED = 'build.completed',
  BUILD_FAILED = 'build.failed',

  TEST_STARTED = 'test.started',
  TEST_COMPLETED = 'test.completed',
  TEST_FAILED = 'test.failed',

  VISUAL_STARTED = 'visual.started',
  VISUAL_COMPLETED = 'visual.completed',
  VISUAL_FAILED = 'visual.failed',

  UE_AUTHORING_STARTED = 'ue.authoring.started',
  UE_AUTHORING_COMPLETED = 'ue.authoring.completed',
  UE_AUTHORING_FAILED = 'ue.authoring.failed',

  FIX_STARTED = 'fix.started',
  FIX_COMPLETED = 'fix.completed',
  FIX_FAILED = 'fix.failed',

  DEPLOYMENT_STARTED = 'deployment.started',
  DEPLOYMENT_COMPLETED = 'deployment.completed',
  DEPLOYMENT_FAILED = 'deployment.failed',

  PR_CREATED = 'pr.created',
  PR_APPROVED = 'pr.approved',
  PR_REJECTED = 'pr.rejected',

  QUALITY_GATE_PASSED = 'quality_gate.passed',
  QUALITY_GATE_FAILED = 'quality_gate.failed',
}

// ============================================================
// Source Types
// ============================================================
export enum SourceType {
  FIGMA = 'FIGMA',
  EXISTING_WEBSITE = 'EXISTING_WEBSITE',
  EXISTING_AEM_PAGE = 'EXISTING_AEM_PAGE',
  EXISTING_EDS_PROJECT = 'EXISTING_EDS_PROJECT',
  SCREENSHOT = 'SCREENSHOT',
  NATURAL_LANGUAGE = 'NATURAL_LANGUAGE',
}

// ============================================================
// LLM Provider
// ============================================================
export enum LLMProvider {
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  GOOGLE_GEMINI = 'GOOGLE_GEMINI',
  AZURE_OPENAI = 'AZURE_OPENAI',
  OLLAMA = 'OLLAMA',
  CUSTOM = 'CUSTOM',
}

// ============================================================
// Tool Status
// ============================================================
export enum ToolStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  DENIED = 'DENIED',
  TIMEOUT = 'TIMEOUT',
}

// ============================================================
// Bug Severity
// ============================================================
export enum BugSeverity {
  CRITICAL = 'CRITICAL',
  SERIOUS = 'SERIOUS',
  MODERATE = 'MODERATE',
  MINOR = 'MINOR',
}

// ============================================================
// Bug Category
// ============================================================
export enum BugCategory {
  BUILD = 'BUILD',
  FUNCTIONAL = 'FUNCTIONAL',
  VISUAL = 'VISUAL',
  ACCESSIBILITY = 'ACCESSIBILITY',
  PERFORMANCE = 'PERFORMANCE',
  UNIVERSAL_EDITOR = 'UNIVERSAL_EDITOR',
  REGRESSION = 'REGRESSION',
}

// ============================================================
// Error Classification
// ============================================================
export enum ErrorClass {
  TRANSIENT = 'TRANSIENT',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  CODE = 'CODE',
  BUILD = 'BUILD',
  TEST = 'TEST',
  VISUAL = 'VISUAL',
  NETWORK = 'NETWORK',
  CONFIGURATION = 'CONFIGURATION',
  HUMAN_REQUIRED = 'HUMAN_REQUIRED',
}

// ============================================================
// Actor in event
// ============================================================
export enum EventActor {
  AGENT = 'agent',
  TOOL = 'tool',
  SYSTEM = 'system',
  USER = 'user',
}

// ============================================================
// Quality Gate Status
// ============================================================
export enum QualityGateStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

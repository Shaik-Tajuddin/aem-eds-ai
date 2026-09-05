// ============================================================
// @aeds/aem — Types & Data Contracts
// Universal Editor & AEM Cloud Adapter
// ============================================================

export interface AemImsConfig {
  clientId: string;
  clientSecret: string;
  technicalAccountId: string;
  orgId: string;
  privateKey: string;
  metaScopes?: string[];
}

export interface AemClientConfig {
  authorUrl: string;
  previewUrl?: string;
  liveUrl?: string;
  bearerToken?: string;
  imsConfig?: AemImsConfig;
  timeoutMs?: number;
}

export interface PublishResult {
  path: string;
  published: boolean;
  publishedAt: string;
  environment: 'preview' | 'live';
  status: number;
  message?: string;
}

export interface ComponentPlugin {
  id: string;
  config?: Record<string, unknown>;
}

export interface ComponentDefinition {
  id: string;
  title: string;
  category?: string;
  description?: string;
  plugins?: Record<string, unknown>;
}

export type UniversalEditorFieldType =
  | 'text'
  | 'richtext'
  | 'aem-content'
  | 'reference'
  | 'select'
  | 'boolean'
  | 'date'
  | 'number'
  | 'multifield';

export interface ComponentFieldOption {
  name: string;
  value: string | number;
}

export interface ComponentField {
  id: string;
  label: string;
  component: UniversalEditorFieldType;
  valueType?: 'string' | 'number' | 'boolean';
  required?: boolean;
  emptyText?: string;
  options?: ComponentFieldOption[];
  validation?: {
    pattern?: string;
    message?: string;
    min?: number;
    max?: number;
  };
  fields?: ComponentField[]; // For nested multifield
}

export interface ComponentModel {
  id: string;
  fields: ComponentField[];
}

export interface ComponentFilter {
  id: string;
  components: string[];
}

export interface BlockManifest {
  name: string;
  title?: string;
  category?: string;
  description?: string;
  fields: Array<{
    name: string;
    label?: string;
    type?: UniversalEditorFieldType;
    required?: boolean;
    options?: Array<{ name: string; value: string }>;
  }>;
}

export interface InstrumentationCheck {
  valid: boolean;
  missingAttributes: string[];
  blockName: string;
  resourcePath?: string;
  modelId?: string;
}

export interface AuthoringFieldCheck {
  fieldName: string;
  fieldLabel: string;
  passed: boolean;
  authoredValue: unknown;
  persistedValue: unknown;
  renderedValue: unknown;
  error?: string;
}

export interface BlockAuthoringResult {
  blockName: string;
  passed: boolean;
  fieldsTested: number;
  fields: AuthoringFieldCheck[];
  error?: string;
}

export interface AuthoringValidationReport {
  blocksTested: number;
  fieldsTested: number;
  passed: boolean;
  results: BlockAuthoringResult[];
  validatedAt: string;
}

export interface ContentFragmentData {
  id: string;
  title: string;
  model: string;
  path: string;
  elements: Record<string, { value: unknown; dataType: string }>;
}

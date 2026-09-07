// ============================================================
// EDS (Edge Delivery Services) Types
// ============================================================

/** Engineering IR — Architecture → Coding contract (never Figma → JS directly) */
export type EDSComponentType = 'block' | 'section' | 'utility';

export interface FieldIR {
  name: string;
  label: string;
  component: string;
  required?: boolean;
  multi?: boolean;
  valueType?: string;
}

export interface OptionIR {
  name: string;
  values: string[];
  defaultValue?: string;
}

export interface ResponsiveRuleIR {
  breakpoint: string;
  behavior: string;
}

export interface TestCaseIR {
  name: string;
  description: string;
  selector?: string;
  assertions: string[];
}

export interface VisualRequirementIR {
  name: string;
  viewport: 'desktop' | 'tablet' | 'mobile';
  thresholdPercent?: number;
}

export interface EDSComponentIR {
  name: string;
  type: EDSComponentType;
  authoring: {
    editable: boolean;
    fields: FieldIR[];
    options: OptionIR[];
  };
  rendering: {
    semanticHtml: string;
    responsiveBehavior: ResponsiveRuleIR[];
  };
  implementation: {
    css: string[];
    javascript: string[];
  };
  dependencies: string[];
  accessibility: {
    requirements: string[];
  };
  testing: {
    functional: TestCaseIR[];
    visual: VisualRequirementIR[];
  };
}

export interface EDSArchitectureIR {
  id: string;
  projectId?: string;
  createdAt: string;
  components: EDSComponentIR[];
  reuseDecisions: Array<{
    component: string;
    decision: 'reuse' | 'option' | 'new' | 'utility';
    rationale: string;
  }>;
  conventions: string[];
}

export type EvidenceStatus = 'PASS' | 'FAIL' | 'SKIPPED' | 'UNAVAILABLE';

export interface SystemEvidence {
  id: string;
  kind:
    | 'build'
    | 'lint'
    | 'browser'
    | 'visual'
    | 'accessibility'
    | 'performance'
    | 'quality-gate'
    | 'github'
    | 'other';
  status: EvidenceStatus;
  summary: string;
  artifacts?: string[];
  metrics?: Record<string, number | string | boolean>;
  producedAt: string;
  /** Distinguishes live tool output from static offline checks */
  mode: 'live' | 'static' | 'unavailable';
}

export interface EDSBlock {
  name: string;
  htmlStructure: string;
  css: string;
  js: string;
  ueModel?: UEComponentModel;
  componentDefinition?: ComponentDefinition;
  componentFilter?: ComponentFilter;
  authoringBehavior?: AuthoringBehavior;
  testCases?: EDSBlockTestCase[];
}

export interface UEComponentModel {
  id: string;
  fields: UEField[];
}

export interface UEField {
  component: string;
  name: string;
  label: string;
  valueType?: string;
  required?: boolean;
  multi?: boolean;
  model?: string;
}

export interface ComponentDefinition {
  title: string;
  id: string;
  plugins: {
    xwalk?: {
      page?: {
        resourceType: string;
        template: ComponentTemplate;
      };
    };
  };
}

export interface ComponentTemplate {
  fields: Array<{
    component: string;
    name: string;
    value?: string;
  }>;
}

export interface ComponentFilter {
  id: string;
  components: string[];
}

export interface AuthoringBehavior {
  droppable: boolean;
  editable: boolean;
  fields: string[];
}

export interface EDSBlockTestCase {
  name: string;
  description: string;
  selector: string;
  assertions: TestAssertion[];
}

export interface TestAssertion {
  type: 'visible' | 'text' | 'attribute' | 'count' | 'href' | 'accessible';
  target?: string;
  expected?: string | number | boolean;
}

export interface EDSProjectAnalysis {
  repository: string;
  branch: string;
  existingBlocks: ExistingBlock[];
  conventions: ProjectConventions;
  designSystem?: DesignSystem;
  buildConfig?: BuildConfig;
  existingTests: string[];
  analyzedAt: string;
}

export interface ExistingBlock {
  name: string;
  hasJs: boolean;
  hasCss: boolean;
  hasModel: boolean;
  hasDefinition: boolean;
  hasTests: boolean;
  patterns: string[];
}

export interface ProjectConventions {
  cssVariables: boolean;
  cssModules: boolean;
  jsModuleType: 'esm' | 'cjs' | 'unknown';
  hasTypeScript: boolean;
  namingConvention: 'kebab-case' | 'camelCase' | 'unknown';
  authoringPattern: 'table' | 'section' | 'mixed' | 'unknown';
}

export interface DesignSystem {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
}

export interface BuildConfig {
  buildCommand?: string;
  devCommand?: string;
  outputDir?: string;
}

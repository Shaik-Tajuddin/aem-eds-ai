// ============================================================
// AEM / Universal Editor Types
// ============================================================

export interface AEMPage {
  path: string;
  title: string;
  template?: string;
  components: AEMComponent[];
  properties: Record<string, unknown>;
}

export interface AEMComponent {
  id: string;
  type: string;
  path: string;
  properties: Record<string, unknown>;
  children?: AEMComponent[];
}

export interface UEAuthoringTest {
  id: string;
  runId: string;
  pageUrl: string;
  blockName: string;
  action: UEAuthoringAction;
  status: 'passed' | 'failed' | 'skipped';
  evidence?: string; // screenshot path
  errorMessage?: string;
  timestamp: string;
}

export type UEAuthoringAction =
  | 'add'
  | 'edit'
  | 'save'
  | 'reopen'
  | 'verify-field'
  | 'verify-render'
  | 'verify-navigation';

export interface UETestSuite {
  runId: string;
  pageUrl: string;
  blocksCount: number;
  fieldsCount: number;
  passed: boolean;
  tests: UEAuthoringTest[];
}

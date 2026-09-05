import type { QualityGateStatus } from '../enums/index.js';
import type { QualityGateName } from './project.js';

// ============================================================
// Quality Gate
// ============================================================

export interface QualityGate {
  id: string;
  runId: string;
  status: QualityGateStatus;
  requiredGates: QualityGateName[];
  gates: Record<QualityGateName, QualityGateResult>;
  overallPassed: boolean;
  evaluatedAt?: string;
}

export interface QualityGateResult {
  name: QualityGateName;
  status: QualityGateStatus;
  score?: number;
  threshold?: number;
  passed?: boolean;
  message?: string;
  evidence?: string;
}

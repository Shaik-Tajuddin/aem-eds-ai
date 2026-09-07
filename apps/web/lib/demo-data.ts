import type { RunSummary } from '@aeds/shared';

export const DEMO_NOTICE = '';

export const kpiData = [
  { id: 'active-runs',    label: 'Active Runs',      value: '1',     subtext: '1 in pipeline', trend: 'live'    as const },
  { id: 'projects',       label: 'Projects',         value: '1',     subtext: '1 connected',   trend: 'live'    as const },
  { id: 'success-rate',   label: 'Success Rate',     value: '98.4%', subtext: 'Target ≥95%',   trend: 'up'      as const },
  { id: 'open-issues',    label: 'Open Issues',      value: '0',     subtext: 'Zero defects',  trend: 'neutral' as const },
  { id: 'avg-iterations', label: 'Avg Fix Iterations', value: '1.2', subtext: 'per run',       trend: 'neutral' as const },
  { id: 'avg-runtime',    label: 'Avg Run Time',     value: '3m 42s', subtext: 'historical',   trend: 'neutral' as const },
];

export const activeRuns: any[] = [];

export interface ProjectCardItem {
  id: string;
  name: string;
  health: 'HEALTHY' | 'ISSUES' | 'DEGRADED' | 'UNKNOWN';
  activeRuns: number;
  eds: boolean;
  aem: boolean;
  ue: boolean;
  testsTotal: number;
  testsPassed: number;
  visualScore?: number;
  lastRunAt?: string;
}

export const projectCards: ProjectCardItem[] = [];

export interface AttentionItem {
  id: string;
  runId: string;
  projectName: string;
  type: 'accessibility' | 'build' | 'visual' | 'performance' | 'test';
  title: string;
  detail: string;
  severity: 'critical' | 'warning';
}

export const attentionItems: AttentionItem[] = [];

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: string;
  aiGenerated: boolean;
  title: string;
  runId: string;
  project: string;
  status: 'success' | 'error' | 'warning' | 'info';
}

export const recentActivity: ActivityEvent[] = [];

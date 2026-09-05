// ============================================================
// @aeds/agent — State Machine
// Manages deterministic lifecycle transitions for autonomous EDS runs
// ============================================================

import { RunStatus } from '@aeds/shared';

export interface StateTransitionEvent {
  runId: string;
  fromStatus: RunStatus;
  toStatus: RunStatus;
  timestamp: string;
  reason?: string;
}

export type StateTransitionListener = (event: StateTransitionEvent) => void | Promise<void>;

const ALLOWED_TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  [RunStatus.RECEIVED]: [RunStatus.ANALYZING, RunStatus.CANCELLED, RunStatus.FAILED],
  [RunStatus.ANALYZING]: [RunStatus.PLANNING, RunStatus.PAUSED, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.PLANNING]: [RunStatus.IMPLEMENTING, RunStatus.PAUSED, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.IMPLEMENTING]: [RunStatus.BUILDING, RunStatus.PAUSED, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.BUILDING]: [RunStatus.DEPLOYING_PREVIEW, RunStatus.DIAGNOSING, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.DEPLOYING_PREVIEW]: [RunStatus.UE_AUTHORING, RunStatus.FUNCTIONAL_TESTING, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.UE_AUTHORING]: [RunStatus.FUNCTIONAL_TESTING, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.FUNCTIONAL_TESTING]: [RunStatus.VISUAL_VALIDATION, RunStatus.DIAGNOSING, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.VISUAL_VALIDATION]: [RunStatus.ACCESSIBILITY, RunStatus.DIAGNOSING, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.ACCESSIBILITY]: [RunStatus.PERFORMANCE, RunStatus.DIAGNOSING, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.PERFORMANCE]: [RunStatus.QUALITY_GATE, RunStatus.DIAGNOSING, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.DIAGNOSING]: [RunStatus.FIXING, RunStatus.FAILED, RunStatus.LIMIT_REACHED, RunStatus.CANCELLED],
  [RunStatus.FIXING]: [RunStatus.REGRESSION_TESTING, RunStatus.BUILDING, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.REGRESSION_TESTING]: [RunStatus.QUALITY_GATE, RunStatus.DIAGNOSING, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.QUALITY_GATE]: [RunStatus.PR_CREATED, RunStatus.DIAGNOSING, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.PR_CREATED]: [RunStatus.WAITING_APPROVAL, RunStatus.DEPLOYED, RunStatus.FAILED, RunStatus.CANCELLED],
  [RunStatus.WAITING_APPROVAL]: [RunStatus.DEPLOYED, RunStatus.CANCELLED, RunStatus.FAILED],
  [RunStatus.DEPLOYED]: [], // Terminal success
  [RunStatus.PAUSED]: [RunStatus.ANALYZING, RunStatus.PLANNING, RunStatus.IMPLEMENTING, RunStatus.BUILDING, RunStatus.CANCELLED],
  [RunStatus.CANCELLED]: [], // Terminal
  [RunStatus.FAILED]: [RunStatus.ANALYZING, RunStatus.PLANNING], // Retryable from start
  [RunStatus.LIMIT_REACHED]: [RunStatus.WAITING_APPROVAL, RunStatus.CANCELLED],
};

export class RunStateMachine {
  private currentStatus: RunStatus;
  private readonly runId: string;
  private listeners: StateTransitionListener[] = [];
  private history: StateTransitionEvent[] = [];
  private fixIterations = 0;
  private readonly maxFixIterations: number;

  constructor(runId: string, initialStatus = RunStatus.RECEIVED, maxFixIterations = 5) {
    this.runId = runId;
    this.currentStatus = initialStatus;
    this.maxFixIterations = maxFixIterations;
  }

  public getStatus(): RunStatus {
    return this.currentStatus;
  }

  public getHistory(): ReadonlyArray<StateTransitionEvent> {
    return this.history;
  }

  public getFixIterations(): number {
    return this.fixIterations;
  }

  public onTransition(listener: StateTransitionListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public canTransitionTo(targetStatus: RunStatus): boolean {
    const allowed = ALLOWED_TRANSITIONS[this.currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  public async transition(targetStatus: RunStatus, reason?: string): Promise<StateTransitionEvent> {
    if (this.currentStatus === targetStatus) {
      return this.history[this.history.length - 1];
    }

    if (!this.canTransitionTo(targetStatus)) {
      throw new Error(
        `Invalid state transition for run "${this.runId}": cannot transition from ${this.currentStatus} to ${targetStatus}`
      );
    }

    // Track fix iteration loops
    if (targetStatus === RunStatus.FIXING) {
      this.fixIterations++;
      if (this.fixIterations > this.maxFixIterations) {
        return this.transition(
          RunStatus.LIMIT_REACHED,
          `Exceeded maximum fix iterations (${this.maxFixIterations}) without passing quality gates`
        );
      }
    }

    const event: StateTransitionEvent = {
      runId: this.runId,
      fromStatus: this.currentStatus,
      toStatus: targetStatus,
      timestamp: new Date().toISOString(),
      reason,
    };

    this.currentStatus = targetStatus;
    this.history.push(event);

    for (const listener of this.listeners) {
      try {
        await listener(event);
      } catch (err) {
        console.error(`State transition listener error on run ${this.runId}:`, err);
      }
    }

    return event;
  }
}

// ============================================================
// Durable pending tool approvals (agent_runs.state_snapshot)
// ============================================================

import { eq } from 'drizzle-orm';
import { agentRuns, toolCalls } from './schema/index.js';

export interface DurablePendingToolApproval {
  callId: string;
  toolName: string;
  namespace: string;
  riskLevel: string;
  runId: string;
  projectId: string;
  /** Raw tool input needed to re-execute after approval (no secrets expected). */
  input: Record<string, unknown>;
  sanitizedInput: Record<string, unknown>;
  createdAt: string;
  reason?: string;
}

type Db = {
  select: (...args: any[]) => any;
  update: (...args: any[]) => any;
  insert: (...args: any[]) => any;
};

function asSnapshot(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw ? { ...(raw as Record<string, unknown>) } : {};
}

export function listPendingFromSnapshot(snapshot: unknown): DurablePendingToolApproval[] {
  const s = asSnapshot(snapshot);
  const list = s.pendingToolApprovals;
  return Array.isArray(list) ? (list as DurablePendingToolApproval[]) : [];
}

/**
 * Append a pending approval into agent_runs.state_snapshot and insert a PENDING tool_calls row.
 */
export async function persistPendingToolApproval(
  db: Db,
  pending: DurablePendingToolApproval,
): Promise<void> {
  const [run] = await db
    .select({ stateSnapshot: agentRuns.stateSnapshot })
    .from(agentRuns)
    .where(eq(agentRuns.id, pending.runId))
    .limit(1);

  const snapshot = asSnapshot(run?.stateSnapshot);
  const existing = listPendingFromSnapshot(snapshot).filter((p) => p.callId !== pending.callId);
  const nextSnapshot = {
    ...snapshot,
    pendingToolApprovals: [...existing, pending],
  };

  await db
    .update(agentRuns)
    .set({
      stateSnapshot: nextSnapshot,
      updatedAt: new Date(),
    })
    .where(eq(agentRuns.id, pending.runId));

  try {
    await db.insert(toolCalls).values({
      runId: pending.runId,
      toolName: pending.toolName,
      namespace: pending.namespace,
      status: 'PENDING',
      riskLevel: pending.riskLevel,
      sanitizedInput: {
        ...pending.sanitizedInput,
        _approvalCallId: pending.callId,
      },
      error: pending.reason || 'APPROVAL_REQUIRED',
      durationMs: 0,
    });
  } catch {
    // Non-fatal — snapshot is the source of truth for completion
  }
}

/**
 * Remove a pending approval from state_snapshot (after approve or deny).
 */
export async function removePendingToolApproval(
  db: Db,
  runId: string,
  callId: string,
): Promise<DurablePendingToolApproval | null> {
  const [run] = await db
    .select({ stateSnapshot: agentRuns.stateSnapshot })
    .from(agentRuns)
    .where(eq(agentRuns.id, runId))
    .limit(1);

  const snapshot = asSnapshot(run?.stateSnapshot);
  const existing = listPendingFromSnapshot(snapshot);
  const found = existing.find((p) => p.callId === callId) || null;
  const next = existing.filter((p) => p.callId !== callId);

  await db
    .update(agentRuns)
    .set({
      stateSnapshot: {
        ...snapshot,
        pendingToolApprovals: next,
      },
      updatedAt: new Date(),
    })
    .where(eq(agentRuns.id, runId));

  return found;
}

export async function getPendingToolApproval(
  db: Db,
  runId: string,
  callId: string,
): Promise<DurablePendingToolApproval | null> {
  const [run] = await db
    .select({ stateSnapshot: agentRuns.stateSnapshot })
    .from(agentRuns)
    .where(eq(agentRuns.id, runId))
    .limit(1);

  return listPendingFromSnapshot(run?.stateSnapshot).find((p) => p.callId === callId) || null;
}

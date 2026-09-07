// ============================================================
// Persist Universal Editor authoring evidence rows
// ============================================================

import { ueAuthoringTests } from './schema/index.js';

type Db = {
  insert: (...args: any[]) => any;
};

export interface UeAuthoringPhaseRow {
  action: string;
  status: string;
  errorMessage?: string;
}

/**
 * Write one row per authoring phase. Never invents PASS — caller supplies statuses.
 */
export async function persistUeAuthoringTestRows(
  db: Db,
  input: {
    runId: string;
    pageUrl: string;
    blockName: string;
    phases: UeAuthoringPhaseRow[];
    evidencePath?: string;
  },
): Promise<number> {
  if (!input.phases.length) return 0;

  await db.insert(ueAuthoringTests).values(
    input.phases.map((p) => ({
      runId: input.runId,
      pageUrl: input.pageUrl,
      blockName: input.blockName,
      action: p.action,
      status: p.status,
      evidencePath: input.evidencePath || null,
      errorMessage: p.errorMessage || null,
    })),
  );

  return input.phases.length;
}

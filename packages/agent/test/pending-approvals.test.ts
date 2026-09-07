import { describe, it, expect } from 'vitest';
import { listPendingFromSnapshot } from '@aeds/database';

describe('durable pending tool approvals', () => {
  it('lists pending approvals from state_snapshot', () => {
    const pending = listPendingFromSnapshot({
      pendingToolApprovals: [
        {
          callId: 'call_1',
          toolName: 'github.mergePR',
          namespace: 'github',
          riskLevel: 'critical',
          runId: 'run-1',
          projectId: 'proj-1',
          input: { pullNumber: 1 },
          sanitizedInput: { pullNumber: 1 },
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    expect(pending).toHaveLength(1);
    expect(pending[0]?.toolName).toBe('github.mergePR');
  });

  it('returns empty for missing snapshot', () => {
    expect(listPendingFromSnapshot(null)).toEqual([]);
    expect(listPendingFromSnapshot({})).toEqual([]);
  });
});

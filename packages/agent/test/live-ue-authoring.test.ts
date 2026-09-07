import { describe, it, expect } from 'vitest';
import { validateLiveUeAuthoringCycle } from '../src/live-ue-authoring.js';

describe('validateLiveUeAuthoringCycle', () => {
  it('returns UNAVAILABLE without storage state / editor URL', async () => {
    const prevState = process.env.UE_STORAGE_STATE_PATH;
    const prevUrl = process.env.UE_EDITOR_URL;
    delete process.env.UE_STORAGE_STATE_PATH;
    delete process.env.UE_EDITOR_URL;

    const result = await validateLiveUeAuthoringCycle({});
    expect(result.evidence.status).toBe('UNAVAILABLE');
    expect(result.phases.open).toBe('UNAVAILABLE');
    expect(result.evidence.summary).toMatch(/UE_STORAGE_STATE_PATH/);

    if (prevState) process.env.UE_STORAGE_STATE_PATH = prevState;
    if (prevUrl) process.env.UE_EDITOR_URL = prevUrl;
  });
});

import { describe, it, expect } from 'vitest';
import { RunStateMachine, AgentOrchestrator } from '../src/index.js';
import { RunStatus, AgentEventType } from '@aeds/shared';

describe('Agent Orchestrator & State Machine', () => {
  describe('RunStateMachine', () => {
    it('initializes in RECEIVED state', () => {
      const sm = new RunStateMachine('test-run-1');
      expect(sm.getStatus()).toBe(RunStatus.RECEIVED);
    });

    it('transitions through valid lifecycle sequence', async () => {
      const sm = new RunStateMachine('test-run-2');
      await sm.transition(RunStatus.ANALYZING);
      expect(sm.getStatus()).toBe(RunStatus.ANALYZING);

      await sm.transition(RunStatus.PLANNING);
      expect(sm.getStatus()).toBe(RunStatus.PLANNING);

      await sm.transition(RunStatus.IMPLEMENTING);
      expect(sm.getStatus()).toBe(RunStatus.IMPLEMENTING);
    });

    it('rejects invalid state transitions', async () => {
      const sm = new RunStateMachine('test-run-3');
      // Direct jump from RECEIVED to DEPLOYED is forbidden
      await expect(sm.transition(RunStatus.DEPLOYED)).rejects.toThrow();
    });

    it('limits fix iterations and transitions to LIMIT_REACHED', async () => {
      const sm = new RunStateMachine('test-run-4', RunStatus.DIAGNOSING, 2);
      await sm.transition(RunStatus.FIXING);
      await sm.transition(RunStatus.REGRESSION_TESTING);
      await sm.transition(RunStatus.DIAGNOSING);
      await sm.transition(RunStatus.FIXING);
      await sm.transition(RunStatus.REGRESSION_TESTING);
      await sm.transition(RunStatus.DIAGNOSING);

      // Third fix attempt exceeds maxFixIterations = 2
      await sm.transition(RunStatus.FIXING);
      expect(sm.getStatus()).toBe(RunStatus.LIMIT_REACHED);
    });
  });

  describe('AgentOrchestrator Pipeline Execution', () => {
    it('executes full pipeline, generates files, and delivers preview URL', async () => {
      const orchestrator = new AgentOrchestrator('run-e2e-1');
      const receivedEvents: AgentEventType[] = [];

      orchestrator.onEvent((type) => {
        receivedEvents.push(type);
      });

      const result = await orchestrator.execute({
        runId: 'run-e2e-1',
        projectId: 'proj-acme',
        repoOwner: 'adobe',
        repoName: 'aem-boilerplate',
        sourceType: 'FIGMA',
      });

      expect(result.finalStatus).toBe(RunStatus.PR_CREATED);
      expect(result.files.length).toBeGreaterThanOrEqual(4);
      expect(result.previewUrl).toContain('hlx.page');
      expect(receivedEvents).toContain(AgentEventType.AGENT_STARTED);
      expect(receivedEvents).toContain(AgentEventType.AGENT_COMPLETED);

      // Verify EDS specific files exist in generation output
      const paths = result.files.map((f) => f.path);
      expect(paths).toContain('blocks/hero/hero.js');
      expect(paths).toContain('blocks/hero/hero.css');
      expect(paths).toContain('_component-definition.json');
      expect(paths).toContain('_component-models.json');
    });
  });
});

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

      expect(result.finalStatus).toBe(RunStatus.WAITING_APPROVAL);
      expect(result.files.length).toBeGreaterThanOrEqual(4);
      expect(result.previewUrl).toContain('aem.live');
      expect(receivedEvents).toContain(AgentEventType.AGENT_STARTED);
      expect(receivedEvents).toContain(AgentEventType.AGENT_COMPLETED);

      // Verify EDS specific files exist in generation output
      const paths = result.files.map((f) => f.path);
      expect(paths).toContain('blocks/hero/hero.js');
      expect(paths).toContain('blocks/hero/hero.css');
      // XWalk sources — build:json compiles these into root component-*.json (no underscore)
      expect(paths).toContain('blocks/hero/_hero.json');
      expect(paths).not.toContain('_component-definition.json');
      expect(paths).not.toContain('_component-models.json');
      // In tests GitHub is skipped → _section.json treated as NotFound and created
      expect(paths).toContain('models/_section.json');
      const sectionFile = result.files.find((f) => f.path === 'models/_section.json');
      expect(sectionFile?.content).toContain('"id": "section"');
      expect(sectionFile?.content).toContain('hero');
    });

    it('triggers dynamic self-healing loop when defects are detected and recovers to PR_CREATED', async () => {
      const orchestrator = new AgentOrchestrator('run-heal-1');
      const phasesRun: RunStatus[] = [];

      orchestrator.onEvent((type, payload) => {
        if (type === AgentEventType.AGENT_STEP_STARTED && payload.phase) {
          phasesRun.push(payload.phase as RunStatus);
        }
      });

      // Register a mock QA agent that injects an unresolved bug on its first pass
      let qaCalls = 0;
      orchestrator.registerAgent({
        id: 'agent-qa-mock',
        name: 'Mock QA',
        description: 'Test QA Agent with bug detection',
        phase: RunStatus.FUNCTIONAL_TESTING,
        execute: async (ctx) => {
          qaCalls++;
          if (qaCalls === 1) {
            ctx.bugs.push({
              id: 'bug-101',
              title: 'Accessibility contrast failure on CTA button',
              severity: 'HIGH',
              description: 'Color contrast ratio 3.2:1 is below required 4.5:1',
              resolved: false,
            });
          }
          return { success: true };
        },
      } as any);

      const result = await orchestrator.execute({
        runId: 'run-heal-1',
        projectId: 'proj-acme',
        repoOwner: 'adobe',
        repoName: 'aem-boilerplate',
        sourceType: 'FIGMA',
      });

      expect(result.finalStatus).toBe(RunStatus.WAITING_APPROVAL);
      expect(phasesRun).toContain(RunStatus.DIAGNOSING);
      expect(phasesRun).toContain(RunStatus.FIXING);
      expect(phasesRun).toContain(RunStatus.REGRESSION_TESTING);
      expect(orchestrator.getStateMachine().getFixIterations()).toBe(1);
    });
  });
});

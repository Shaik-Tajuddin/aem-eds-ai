import type { FastifyPluginAsync } from 'fastify';
import {
  getDatabase,
  agentRuns,
  agentEvents,
  toolCalls,
  eq,
  listPendingFromSnapshot,
  getPendingToolApproval,
  removePendingToolApproval,
} from '@aeds/database';

export const toolsPlugin: FastifyPluginAsync = async (server) => {
  const db = getDatabase();

  // GET /api/tools — list registered production tools (definitions only; no secrets)
  server.get(
    '/',
    {
      schema: {
        tags: ['tools'],
        summary: 'List registered tool definitions',
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      const { createDefaultToolRegistry } = await import('@aeds/agent');
      const registry = createDefaultToolRegistry();
      const tools = registry.listTools().map((t) => ({
        name: t.name,
        namespace: t.namespace,
        description: t.description,
        riskLevel: t.riskLevel,
        requiresApproval: Boolean(t.requiresApproval),
        timeoutMs: t.timeoutMs,
      }));
      return reply.send({ count: tools.length, tools });
    },
  );

  // GET /api/tools/pending — durable pending approvals from state_snapshot
  server.get<{ Querystring: { runId?: string } }>(
    '/pending',
    {
      schema: {
        tags: ['tools'],
        summary: 'List durable pending tool approvals (from run state_snapshot)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const runId = request.query.runId;
      if (!runId) {
        return reply.status(400).send({ error: 'runId query parameter is required' });
      }

      const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
      if (!run) return reply.status(404).send({ error: 'Run not found' });

      const pending = listPendingFromSnapshot(run.stateSnapshot).map((p) => ({
        callId: p.callId,
        toolName: p.toolName,
        namespace: p.namespace,
        riskLevel: p.riskLevel,
        runId: p.runId,
        projectId: p.projectId,
        sanitizedInput: p.sanitizedInput,
        createdAt: p.createdAt,
        reason: p.reason,
      }));

      return reply.send({ runId, count: pending.length, pending });
    },
  );

  // POST /api/tools/calls/:callId/approve — restore durable pending + execute
  server.post<{
    Params: { callId: string };
    Body: { runId: string; note?: string; approvedBy?: string };
  }>(
    '/calls/:callId/approve',
    {
      schema: {
        tags: ['tools'],
        summary: 'Approve a durable pending tool call and execute it',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const { callId } = request.params;
      const { runId, note, approvedBy } = request.body || ({} as any);
      if (!runId) return reply.status(400).send({ error: 'runId is required' });

      const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
      if (!run) return reply.status(404).send({ error: 'Run not found' });

      const pending = await getPendingToolApproval(db, runId, callId);
      if (!pending) {
        return reply.status(404).send({
          error: `No durable pending approval for callId "${callId}" on run ${runId}`,
        });
      }

      const { createDefaultToolRegistry } = await import('@aeds/agent');
      const registry = createDefaultToolRegistry();
      registry.restorePendingApproval(pending);
      const { result, record } = await registry.approveAndExecute(callId, approvedBy);

      await removePendingToolApproval(db, runId, callId);

      try {
        await db.insert(toolCalls).values({
          runId,
          toolName: record.toolName,
          namespace: String(record.namespace),
          status: String(record.status),
          riskLevel: String(record.riskLevel),
          sanitizedInput: {
            ...(record.sanitizedInput || {}),
            _approvalCallId: callId,
          },
          sanitizedOutput: record.sanitizedOutput || null,
          error: record.error || null,
          durationMs: record.durationMs ?? null,
        });
      } catch (err) {
        server.log.warn({ err, runId }, 'Failed to persist approved tool call');
      }

      await db.insert(agentEvents).values({
        runId,
        projectId: run.projectId,
        type: result.success ? 'tool.approved_executed' : 'tool.approved_failed',
        actor: 'user',
        step: String(run.status),
        status: result.success ? 'PASS' : 'FAIL',
        data: {
          callId,
          toolName: pending.toolName,
          note: note || null,
          approvedBy: approvedBy || null,
          evidence: [
            {
              kind: 'tool_approval',
              status: result.success ? 'PASS' : 'FAIL',
              summary: result.success
                ? `Human approved durable call ${callId} (${pending.toolName})`
                : `Approved execution failed for ${callId}: ${result.error || 'unknown'}`,
            },
          ],
        },
      });

      if (!result.success) {
        return reply.status(502).send({
          error: result.error || 'Approved tool execution failed',
          callId,
          record: { id: record.id, status: record.status, toolName: record.toolName },
        });
      }

      return reply.send({
        message: `Pending tool ${pending.toolName} executed after human approval`,
        callId,
        result: { success: true, data: result.data },
        record: { id: record.id, status: record.status, durationMs: record.durationMs },
      });
    },
  );

  // POST /api/tools/calls/:callId/deny
  server.post<{
    Params: { callId: string };
    Body: { runId: string; reason?: string };
  }>(
    '/calls/:callId/deny',
    {
      schema: {
        tags: ['tools'],
        summary: 'Deny a durable pending tool call',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const { callId } = request.params;
      const { runId, reason } = request.body || ({} as any);
      if (!runId) return reply.status(400).send({ error: 'runId is required' });

      const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
      if (!run) return reply.status(404).send({ error: 'Run not found' });

      const pending = await removePendingToolApproval(db, runId, callId);
      if (!pending) {
        return reply.status(404).send({
          error: `No durable pending approval for callId "${callId}" on run ${runId}`,
        });
      }

      const denyReason = reason?.trim() || 'Denied by human reviewer';

      try {
        await db.insert(toolCalls).values({
          runId,
          toolName: pending.toolName,
          namespace: pending.namespace,
          status: 'DENIED',
          riskLevel: pending.riskLevel,
          sanitizedInput: {
            ...pending.sanitizedInput,
            _approvalCallId: callId,
          },
          error: denyReason,
          durationMs: 0,
        });
      } catch (err) {
        server.log.warn({ err, runId }, 'Failed to persist denied tool call');
      }

      await db.insert(agentEvents).values({
        runId,
        projectId: run.projectId,
        type: 'tool.approval_denied',
        actor: 'user',
        step: String(run.status),
        status: 'FAIL',
        data: {
          callId,
          toolName: pending.toolName,
          reason: denyReason,
          evidence: [
            {
              kind: 'tool_approval',
              status: 'FAIL',
              summary: `Human denied ${pending.toolName} (${callId}): ${denyReason}`,
            },
          ],
        },
      });

      return reply.send({
        message: 'Pending tool call denied',
        callId,
        toolName: pending.toolName,
        status: 'DENIED',
      });
    },
  );

  // POST /api/tools/execute-approved — human-approved completion (explicit input path)
  server.post<{
    Body: {
      runId: string;
      toolName: string;
      input: Record<string, unknown>;
      note?: string;
      approvedBy?: string;
    };
  }>(
    '/execute-approved',
    {
      schema: {
        tags: ['tools'],
        summary: 'Execute a critical/gated tool after explicit human approval',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const { runId, toolName, input, note, approvedBy } = request.body || ({} as any);
      if (!runId || !toolName || !input || typeof input !== 'object') {
        return reply.status(400).send({
          error: 'runId, toolName, and input are required',
        });
      }

      const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
      if (!run) return reply.status(404).send({ error: 'Run not found' });

      const { createDefaultToolRegistry } = await import('@aeds/agent');
      const registry = createDefaultToolRegistry();
      const def = registry.get(toolName)?.definition;
      if (!def) {
        return reply.status(404).send({ error: `Tool "${toolName}" is not registered` });
      }

      if (def.riskLevel !== 'critical' && !def.requiresApproval && def.riskLevel !== 'high') {
        return reply.status(400).send({
          error: `Tool "${toolName}" does not require approval completion (risk=${def.riskLevel})`,
        });
      }

      const { result, record } = await registry.execute(toolName, input, {
        runId,
        projectId: run.projectId,
        forceApprove: true,
      });

      try {
        await db.insert(toolCalls).values({
          runId,
          toolName: record.toolName,
          namespace: String(record.namespace),
          status: String(record.status),
          riskLevel: String(record.riskLevel),
          sanitizedInput: record.sanitizedInput || {},
          sanitizedOutput: record.sanitizedOutput || null,
          error: record.error || null,
          durationMs: record.durationMs ?? null,
        });
      } catch (err) {
        server.log.warn({ err, runId }, 'Failed to persist approved tool call');
      }

      await db.insert(agentEvents).values({
        runId,
        projectId: run.projectId,
        type: result.success ? 'tool.approved_executed' : 'tool.approved_failed',
        actor: 'user',
        step: String(run.status),
        status: result.success ? 'PASS' : 'FAIL',
        data: {
          toolName,
          note: note || null,
          approvedBy: approvedBy || null,
          evidence: [
            {
              kind: 'tool_approval',
              status: result.success ? 'PASS' : 'FAIL',
              summary: result.success
                ? `Human approved and executed ${toolName}`
                : `Approved execution of ${toolName} failed: ${result.error || 'unknown'}`,
            },
          ],
          result: result.success ? { success: true } : { success: false, error: result.error },
        },
      });

      if (!result.success) {
        return reply.status(502).send({
          error: result.error || 'Approved tool execution failed',
          record: { id: record.id, status: record.status, toolName },
        });
      }

      return reply.send({
        message: `Tool ${toolName} executed after human approval`,
        result: { success: true, data: result.data },
        record: { id: record.id, status: record.status, durationMs: record.durationMs },
      });
    },
  );

  // GET /api/tools/evaluation/tasks — benchmark task catalog
  server.get(
    '/evaluation/tasks',
    {
      schema: {
        tags: ['evaluation'],
        summary: 'List evaluation benchmark tasks',
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      try {
        const evaluation = await import('@aeds/evaluation');
        return reply.send({ tasks: evaluation.listBenchmarkTasks() });
      } catch {
        return reply.status(503).send({ error: '@aeds/evaluation package unavailable' });
      }
    },
  );

  // POST /api/tools/evaluation/score — score a run from evidence payload
  server.post<{
    Body: {
      taskId: string;
      runId: string;
      evidence: Array<{ kind: string; status: string; summary: string; id?: string }>;
      bugsOpen?: number;
      humanApproved?: boolean;
    };
  }>(
    '/evaluation/score',
    {
      schema: {
        tags: ['evaluation'],
        summary: 'Score a run against a benchmark task using system evidence',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const evaluation = await import('@aeds/evaluation');
        const result = evaluation.scoreEvaluationRun(request.body as any);
        return reply.send(result);
      } catch (err: unknown) {
        return reply.status(400).send({
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
  );
};

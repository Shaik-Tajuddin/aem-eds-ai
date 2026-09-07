import type { FastifyPluginAsync } from 'fastify';
import { getDatabase, llmCalls, toolCalls, agentRuns, sql, desc, gte, and, eq } from '@aeds/database';

function startOfMonthUtc(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

function formatUsd(n: number): string {
  return `$${n.toFixed(4)}`;
}

export const usagePlugin: FastifyPluginAsync = async (server) => {
  const db = getDatabase();

  // GET /api/usage — aggregate LLM/tool telemetry (honest zeros when empty)
  server.get<{ Querystring: { projectId?: string; since?: string } }>(
    '/',
    {
      schema: {
        tags: ['usage'],
        summary: 'LLM and tool usage summary from persisted telemetry',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const since =
          request.query.since && !Number.isNaN(Date.parse(request.query.since))
            ? new Date(request.query.since)
            : startOfMonthUtc();
        const projectId = request.query.projectId;

        const llmWhere = projectId
          ? and(
              gte(llmCalls.timestamp, since),
              eq(agentRuns.projectId, projectId),
            )
          : gte(llmCalls.timestamp, since);

        // Join when filtering by project
        const byModel = projectId
          ? await db
              .select({
                provider: llmCalls.provider,
                model: llmCalls.model,
                totalCalls: sql<number>`count(*)::int`,
                inputTokens: sql<number>`coalesce(sum(${llmCalls.inputTokens}), 0)::int`,
                outputTokens: sql<number>`coalesce(sum(${llmCalls.outputTokens}), 0)::int`,
                estimatedCostUsd: sql<number>`coalesce(sum(${llmCalls.estimatedCostUsd}), 0)::float`,
                avgLatencyMs: sql<number>`coalesce(avg(${llmCalls.latencyMs}), 0)::float`,
              })
              .from(llmCalls)
              .innerJoin(agentRuns, eq(llmCalls.runId, agentRuns.id))
              .where(llmWhere)
              .groupBy(llmCalls.provider, llmCalls.model)
          : await db
              .select({
                provider: llmCalls.provider,
                model: llmCalls.model,
                totalCalls: sql<number>`count(*)::int`,
                inputTokens: sql<number>`coalesce(sum(${llmCalls.inputTokens}), 0)::int`,
                outputTokens: sql<number>`coalesce(sum(${llmCalls.outputTokens}), 0)::int`,
                estimatedCostUsd: sql<number>`coalesce(sum(${llmCalls.estimatedCostUsd}), 0)::float`,
                avgLatencyMs: sql<number>`coalesce(avg(${llmCalls.latencyMs}), 0)::float`,
              })
              .from(llmCalls)
              .where(gte(llmCalls.timestamp, since))
              .groupBy(llmCalls.provider, llmCalls.model);

        const totals = byModel.reduce(
          (acc, row) => {
            acc.totalCalls += Number(row.totalCalls) || 0;
            acc.inputTokens += Number(row.inputTokens) || 0;
            acc.outputTokens += Number(row.outputTokens) || 0;
            acc.estimatedCostUsd += Number(row.estimatedCostUsd) || 0;
            return acc;
          },
          { totalCalls: 0, inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 },
        );

        const toolCountRow = projectId
          ? await db
              .select({ c: sql<number>`count(*)::int` })
              .from(toolCalls)
              .innerJoin(agentRuns, eq(toolCalls.runId, agentRuns.id))
              .where(and(gte(toolCalls.timestamp, since), eq(agentRuns.projectId, projectId)))
          : await db
              .select({ c: sql<number>`count(*)::int` })
              .from(toolCalls)
              .where(gte(toolCalls.timestamp, since));

        const recent = await db
          .select({
            id: llmCalls.id,
            runId: llmCalls.runId,
            provider: llmCalls.provider,
            model: llmCalls.model,
            inputTokens: llmCalls.inputTokens,
            outputTokens: llmCalls.outputTokens,
            latencyMs: llmCalls.latencyMs,
            status: llmCalls.status,
            estimatedCostUsd: llmCalls.estimatedCostUsd,
            timestamp: llmCalls.timestamp,
          })
          .from(llmCalls)
          .orderBy(desc(llmCalls.timestamp))
          .limit(25);

        const avgLatencyMs =
          byModel.length > 0
            ? byModel.reduce((s, r) => s + (Number(r.avgLatencyMs) || 0) * (Number(r.totalCalls) || 0), 0) /
              Math.max(1, totals.totalCalls)
            : 0;

        return reply.send({
          since: since.toISOString(),
          empty: totals.totalCalls === 0,
          message:
            totals.totalCalls === 0
              ? 'No LLM calls recorded yet — run a pipeline to populate usage telemetry'
              : undefined,
          totals: {
            ...totals,
            totalTokens: totals.inputTokens + totals.outputTokens,
            estimatedCostUsdFormatted: formatUsd(totals.estimatedCostUsd),
            avgLatencyMs: Math.round(avgLatencyMs),
            toolCalls: Number(toolCountRow[0]?.c || 0),
          },
          byModel: byModel.map((r) => ({
            provider: r.provider,
            model: r.model,
            totalCalls: Number(r.totalCalls) || 0,
            inputTokens: Number(r.inputTokens) || 0,
            outputTokens: Number(r.outputTokens) || 0,
            estimatedCostUsd: Number(r.estimatedCostUsd) || 0,
            estimatedCostUsdFormatted: formatUsd(Number(r.estimatedCostUsd) || 0),
            avgLatencyMs: Math.round(Number(r.avgLatencyMs) || 0),
          })),
          recentCalls: recent,
        });
      } catch (err) {
        request.log.error({ err }, 'Failed to load usage summary');
        return reply.status(500).send({ error: 'Failed to load usage summary' });
      }
    },
  );
};

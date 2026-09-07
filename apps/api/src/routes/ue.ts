import type { FastifyPluginAsync } from 'fastify';
import {
  getDatabase,
  agentRuns,
  ueAuthoringTests,
  eq,
  desc,
  and,
  inArray,
} from '@aeds/database';

export const uePlugin: FastifyPluginAsync = async (server) => {
  const db = getDatabase();

  // GET /api/ue/authoring-tests — live evidence rows (optional project filter)
  server.get<{ Querystring: { projectId?: string; runId?: string; limit?: string } }>(
    '/authoring-tests',
    {
      schema: {
        tags: ['ue'],
        summary: 'List Universal Editor authoring evidence rows from ue_authoring_tests',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const { projectId, runId, limit = '100' } = request.query;
        const take = Math.min(Number(limit) || 100, 500);

        if (runId) {
          const rows = await db
            .select()
            .from(ueAuthoringTests)
            .where(eq(ueAuthoringTests.runId, runId))
            .orderBy(desc(ueAuthoringTests.timestamp))
            .limit(take);
          return reply.send({
            empty: rows.length === 0,
            message:
              rows.length === 0
                ? 'No ue_authoring_tests for this run — enable ENABLE_LIVE_UE / ENABLE_LIVE_UE_AUTHORING'
                : undefined,
            runId,
            tests: rows,
          });
        }

        let runIds: string[] | undefined;
        if (projectId) {
          const runs = await db
            .select({ id: agentRuns.id })
            .from(agentRuns)
            .where(eq(agentRuns.projectId, projectId))
            .orderBy(desc(agentRuns.createdAt))
            .limit(25);
          runIds = runs.map((r) => r.id);
          if (runIds.length === 0) {
            return reply.send({
              empty: true,
              message: 'No runs for this project yet',
              projectId,
              tests: [],
              byBlock: [],
              summary: { pass: 0, fail: 0, unavailable: 0, skipped: 0, notRun: 0, total: 0 },
            });
          }
        }

        const rows = await db
          .select()
          .from(ueAuthoringTests)
          .where(runIds ? and(inArray(ueAuthoringTests.runId, runIds)) : undefined)
          .orderBy(desc(ueAuthoringTests.timestamp))
          .limit(take);

        const summary = {
          pass: 0,
          fail: 0,
          unavailable: 0,
          skipped: 0,
          notRun: 0,
          total: rows.length,
        };
        for (const r of rows) {
          const s = String(r.status).toUpperCase();
          if (s === 'PASS') summary.pass += 1;
          else if (s === 'FAIL') summary.fail += 1;
          else if (s === 'UNAVAILABLE') summary.unavailable += 1;
          else if (s === 'SKIPPED') summary.skipped += 1;
          else summary.notRun += 1;
        }

        // Group latest status per blockName + action for dashboard matrix
        const latestByKey = new Map<string, (typeof rows)[0]>();
        for (const r of rows) {
          const key = `${r.blockName}::${r.action}`;
          if (!latestByKey.has(key)) latestByKey.set(key, r);
        }

        const byBlockMap = new Map<
          string,
          {
            blockName: string;
            actions: Record<string, string>;
            pageUrl?: string;
            runId?: string;
            updatedAt?: string;
          }
        >();
        for (const r of latestByKey.values()) {
          const entry = byBlockMap.get(r.blockName) || {
            blockName: r.blockName,
            actions: {},
            pageUrl: r.pageUrl,
            runId: r.runId,
            updatedAt: r.timestamp?.toISOString?.() || String(r.timestamp),
          };
          entry.actions[r.action] = r.status;
          entry.pageUrl = r.pageUrl;
          entry.runId = r.runId;
          entry.updatedAt = r.timestamp?.toISOString?.() || String(r.timestamp);
          byBlockMap.set(r.blockName, entry);
        }

        return reply.send({
          empty: rows.length === 0,
          message:
            rows.length === 0
              ? 'No UE authoring evidence yet — run a pipeline with ENABLE_LIVE_UE or ENABLE_LIVE_UE_AUTHORING'
              : undefined,
          projectId: projectId || null,
          summary,
          byBlock: Array.from(byBlockMap.values()),
          tests: rows,
        });
      } catch (err) {
        request.log.error({ err }, 'Failed to list UE authoring tests');
        return reply.status(500).send({ error: 'Failed to list UE authoring tests' });
      }
    },
  );
};

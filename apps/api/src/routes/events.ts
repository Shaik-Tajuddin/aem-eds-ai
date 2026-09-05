import type { FastifyPluginAsync } from 'fastify';
import { getDatabase } from '@aeds/database';
import { agentEvents } from '@aeds/database';
import { eq, gt, desc } from '@aeds/database';


// ============================================================
// SSE Event Stream
// Provides real-time agent events to the dashboard
// ============================================================

export const eventsPlugin: FastifyPluginAsync = async (server) => {
  const db = getDatabase();

  // GET /api/events/:runId — SSE stream of agent events for a run
  server.get<{ Params: { runId: string }; Querystring: { since?: string } }>(
    '/:runId',
    {
      schema: {
        tags: ['events'],
        summary: 'Real-time SSE stream for agent run events',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const { runId } = request.params;
      const sinceStr = request.query.since;
      let sinceTimestamp = sinceStr ? new Date(sinceStr) : new Date(Date.now() - 60_000);

      // Set SSE headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      });

      reply.raw.write(`data: ${JSON.stringify({ type: 'connected', runId })}\n\n`);

      // Poll for new events every 500ms
      // Phase 4: Replace with Redis pub/sub for true push
      const interval = setInterval(async () => {
        try {
          const events = await db
            .select()
            .from(agentEvents)
            .where(eq(agentEvents.runId, runId))
            .orderBy(desc(agentEvents.timestamp))
            .limit(50);

          const newEvents = events.filter(
            (e: any) => e.timestamp > sinceTimestamp
          );


          for (const event of newEvents.reverse()) {
            // Never send encrypted secrets in events
            const safeEvent = {
              id: event.id,
              runId: event.runId,
              type: event.type,
              actor: event.actor,
              step: event.step,
              status: event.status,
              timestamp: event.timestamp,
              data: event.data,
            };
            reply.raw.write(`data: ${JSON.stringify(safeEvent)}\n\n`);
          }

          if (newEvents.length > 0) {
            sinceTimestamp = new Date();
          }
        } catch (err) {
          request.log.error({ err }, 'SSE poll error');
        }
      }, 500);

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        reply.raw.write(': heartbeat\n\n');
      }, 15_000);

      // Clean up on disconnect
      request.raw.on('close', () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        request.log.debug({ runId }, 'SSE client disconnected');
      });

      // Don't return — keep connection open
      await new Promise<void>((resolve) => {
        request.raw.on('close', resolve);
      });
    }
  );
};

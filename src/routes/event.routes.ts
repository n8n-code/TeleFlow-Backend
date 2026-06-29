import type { FastifyInstance } from 'fastify';
import { handleSSE, handleWebSocket } from '../controllers/event.controller.js';

export default async function eventRoutes(fastify: FastifyInstance): Promise<void> {
  // ─── GET /events (SSE) ───────────────────────────────────────
  fastify.get('/events', {
    schema: {
      tags: ['Events'],
      summary: 'Subscribe to events via SSE',
      description:
        'Open a Server-Sent Events stream to receive real-time TeleFlow events. The connection stays open and events are pushed as they occur.',
      response: {
        200: {
          description: 'SSE stream of TeleFlow events',
          type: 'string',
        },
      },
    },
    handler: handleSSE,
  });

  // ─── GET /ws (WebSocket) ─────────────────────────────────────
  fastify.get('/ws', {
    websocket: true,
    schema: {
      tags: ['Events'],
      summary: 'Subscribe to events via WebSocket',
      description:
        'Open a WebSocket connection to receive real-time TeleFlow events. Send JSON filter messages to subscribe/unsubscribe from specific event types: { "action": "subscribe" | "unsubscribe", "events": ["message.new", "session.connected"] }',
    },
    handler: handleWebSocket as never,
  });
}

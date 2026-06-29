import type { FastifyRequest, FastifyReply } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { eventDispatcher } from '../events/dispatcher.js';
import { createChildLogger } from '../utils/logger.js';
import type { TeleFlowEvent } from '../types/index.js';

const log = createChildLogger({ module: 'event-controller' });

// ─── SSE Handler ─────────────────────────────────────────────────

export async function handleSSE(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Set SSE headers on the raw response
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial connection event
  reply.raw.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Subscribe to all events
  const handler = (event: TeleFlowEvent) => {
    try {
      reply.raw.write(`id: ${event.id}\n`);
      reply.raw.write(`event: ${event.type}\n`);
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      // Client disconnected, will be cleaned up below
    }
  };

  eventDispatcher.on('*', handler);
  log.info('SSE client connected');

  // Keep-alive heartbeat
  const heartbeat = setInterval(() => {
    try {
      reply.raw.write(`:heartbeat\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 30_000);

  // Clean up on client disconnect
  request.raw.on('close', () => {
    clearInterval(heartbeat);
    eventDispatcher.off('*', handler);
    log.info('SSE client disconnected');
  });
}

// ─── WebSocket Handler ───────────────────────────────────────────

interface WsFilterMessage {
  action: 'subscribe' | 'unsubscribe';
  events?: string[];
}

export function handleWebSocket(socket: WebSocket, request: FastifyRequest): void {
  const subscribedEvents = new Set<string>(['*']);

  log.info('WebSocket client connected');

  // Send initial connection message
  socket.send(
    JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }),
  );

  // Event handler
  const handler = (event: TeleFlowEvent) => {
    // Send if subscribed to all events or the specific event type
    if (subscribedEvents.has('*') || subscribedEvents.has(event.type)) {
      try {
        socket.send(JSON.stringify(event));
      } catch {
        // Socket closed, will be cleaned up
      }
    }
  };

  eventDispatcher.on('*', handler);

  // Accept filter messages from client
  socket.on('message', (raw: Buffer | ArrayBuffer | Buffer[]) => {
    try {
      const data = JSON.parse(raw.toString()) as WsFilterMessage;

      if (data.action === 'subscribe' && data.events) {
        for (const eventType of data.events) {
          subscribedEvents.add(eventType);
        }
        socket.send(
          JSON.stringify({
            type: 'subscribed',
            events: [...subscribedEvents],
          }),
        );
      } else if (data.action === 'unsubscribe' && data.events) {
        for (const eventType of data.events) {
          subscribedEvents.delete(eventType);
        }
        socket.send(
          JSON.stringify({
            type: 'unsubscribed',
            events: [...subscribedEvents],
          }),
        );
      }
    } catch {
      socket.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid message format. Expected JSON with { action, events }.',
        }),
      );
    }
  });

  // Clean up on disconnect
  socket.on('close', () => {
    eventDispatcher.off('*', handler);
    log.info('WebSocket client disconnected');
  });

  socket.on('error', (err: Error) => {
    log.error(err, 'WebSocket error');
    eventDispatcher.off('*', handler);
  });

  // Ignore the request parameter lint — it's used for context in Fastify
  void request;
}

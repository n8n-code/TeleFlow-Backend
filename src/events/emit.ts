import { nanoid } from 'nanoid';
import { eventDispatcher } from './dispatcher.js';
import { deliverToAllWebhooks } from '../webhooks/sender.js';
import { createChildLogger } from '../utils/logger.js';
import type { TeleFlowEvent } from '../types/index.js';

const log = createChildLogger({ module: 'event-emitter' });

let bridgeRegistered = false;

/**
 * Ensures the eventDispatcher → webhook delivery bridge is set up.
 * Call once at server startup. The wildcard listener forwards every
 * dispatched event to all matching active webhooks.
 */
export function ensureWebhookBridge(): void {
  if (bridgeRegistered) return;
  bridgeRegistered = true;

  eventDispatcher.on('*', (event: TeleFlowEvent) => {
    // Fire-and-forget — delivery failures are logged inside deliverEvent
    deliverToAllWebhooks(event).catch((err) => {
      log.error({ err, eventType: event.type }, 'Webhook delivery failed');
    });
  });

  log.info('Event → webhook bridge registered');
}

/**
 * Emit a TeleFlowEvent: dispatch to the in-process event bus (for SSE/WS
 * subscribers) AND trigger webhook delivery for matching webhooks.
 */
export function emitEvent(
  type: string,
  sessionId: string,
  data: Record<string, unknown>,
): void {
  const event: TeleFlowEvent = {
    id: nanoid(),
    type,
    sessionId,
    timestamp: new Date().toISOString(),
    data,
  };

  eventDispatcher.dispatch(event);
  log.debug({ type, sessionId, eventId: event.id }, 'Event emitted');
}

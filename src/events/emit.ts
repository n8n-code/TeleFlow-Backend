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

// ─── Dedup for state-transition events ────────────────────────────
// session.connected/disconnected and message.read can fire twice in quick
// succession (e.g. startup reconnect + manual connect, or double API call).
// Suppress the second emission within a short window for the same
// (type, sessionId) pair. Data-payload events (message.sent, etc.) are NOT
// deduped here — every message is genuinely unique.
const DEDUP_WINDOW_MS = 3000;
const recentEmits = new Map<string, number>();

/** Event types that represent a state (idempotent) vs a data occurrence. */
const STATE_EVENT_TYPES = new Set([
  'session.connected',
  'session.disconnected',
  'session.authorized',
  'session.deleted',
  'message.read',
]);

// Periodic prune
setInterval(() => {
  const cutoff = Date.now() - DEDUP_WINDOW_MS * 2;
  for (const [k, t] of recentEmits) {
    if (t < cutoff) recentEmits.delete(k);
  }
}, 15000).unref?.();

/**
 * Emit a TeleFlowEvent: dispatch to the in-process event bus (for SSE/WS
 * subscribers) AND trigger webhook delivery for matching webhooks.
 *
 * State-transition events (session.connected, message.read, etc.) are
 * deduped within a 3s window per (type, sessionId) to suppress accidental
 * double-fires (e.g. startup reconnect + manual connect).
 */
export function emitEvent(
  type: string,
  sessionId: string,
  data: Record<string, unknown>,
): void {
  // Dedup state events
  if (STATE_EVENT_TYPES.has(type)) {
    const key = `${type}:${sessionId}`;
    const now = Date.now();
    const last = recentEmits.get(key);
    if (last !== undefined && now - last < DEDUP_WINDOW_MS) {
      log.debug({ type, sessionId }, 'Suppressing duplicate state event');
      return;
    }
    recentEmits.set(key, now);
  }

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

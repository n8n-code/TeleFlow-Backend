import type { TeleFlowEvent, WebhookConfig } from '../types/index.js';
import { prisma } from '../database/prisma.js';
import { sign } from './signer.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger({ module: 'webhook-sender' });

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 10000]; // ms

// ─── Deliver a single event to a single webhook ─────────────────

export async function deliverEvent(
  webhook: WebhookConfig,
  event: TeleFlowEvent,
): Promise<void> {
  const payloadString = JSON.stringify(event);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'TeleFlow-Webhook/0.1.0',
    'X-TeleFlow-Event': event.type,
    'X-TeleFlow-Delivery-Id': event.id,
  };

  // Sign payload if webhook has a secret
  if (webhook.secret) {
    headers['X-TeleFlow-Signature'] = sign(payloadString, webhook.secret);
  }

  let lastError: Error | null = null;
  let statusCode = 0;
  let responseBody: string | null = null;
  let duration = 0;
  let attempts = 0;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    attempts = attempt + 1;

    if (attempt > 0) {
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
    }

    const startTime = Date.now();

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      duration = Date.now() - startTime;
      statusCode = response.status;
      responseBody = await response.text();

      if (response.ok) {
        log.debug(
          { webhookId: webhook.id, eventId: event.id, status: statusCode, attempts },
          'Webhook delivered successfully',
        );

        await saveDelivery(webhook.id, event, statusCode, responseBody, duration, true, attempts);
        return;
      }

      // Non-OK status — will retry
      lastError = new Error(`HTTP ${statusCode}: ${responseBody}`);
      log.warn(
        { webhookId: webhook.id, eventId: event.id, status: statusCode, attempt: attempts },
        'Webhook delivery failed, retrying',
      );
    } catch (err) {
      duration = Date.now() - startTime;
      lastError = err instanceof Error ? err : new Error(String(err));
      log.warn(
        { webhookId: webhook.id, eventId: event.id, err: lastError.message, attempt: attempts },
        'Webhook delivery error, retrying',
      );
    }
  }

  // All retries exhausted
  log.error(
    { webhookId: webhook.id, eventId: event.id, err: lastError?.message },
    'Webhook delivery failed after all retries',
  );

  await saveDelivery(
    webhook.id,
    event,
    statusCode,
    responseBody ?? lastError?.message ?? null,
    duration,
    false,
    attempts,
  );
}

// ─── Deliver event to all matching active webhooks ───────────────

export async function deliverToAllWebhooks(event: TeleFlowEvent): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: { isActive: true },
  });

  const matchingWebhooks = webhooks.filter((wh) => {
    const events: string[] = JSON.parse(wh.events);
    return events.includes('*') || events.includes(event.type);
  });

  if (matchingWebhooks.length === 0) {
    return;
  }

  log.debug(
    { eventType: event.type, webhookCount: matchingWebhooks.length },
    'Delivering event to webhooks',
  );

  const deliveryPromises = matchingWebhooks.map((wh) => {
    const config: WebhookConfig = {
      id: wh.id,
      url: wh.url,
      secret: wh.secret,
      events: JSON.parse(wh.events),
      isActive: wh.isActive,
    };
    return deliverEvent(config, event).catch((err) => {
      log.error({ webhookId: wh.id, err }, 'Unexpected error delivering webhook');
    });
  });

  await Promise.allSettled(deliveryPromises);
}

// ─── Save delivery record to DB ─────────────────────────────────

async function saveDelivery(
  webhookId: string,
  event: TeleFlowEvent,
  status: number,
  response: string | null,
  duration: number,
  success: boolean,
  attempts: number,
): Promise<void> {
  try {
    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        event: event.type,
        payload: JSON.stringify(event),
        status,
        response,
        duration,
        success,
        attempts,
      },
    });
  } catch (err) {
    log.error({ err, webhookId, eventId: event.id }, 'Failed to save webhook delivery record');
  }
}

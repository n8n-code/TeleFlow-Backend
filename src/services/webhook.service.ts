import { prisma } from '../database/prisma.js';
import { generateSecret } from '../utils/crypto.js';
import { Errors } from '../utils/errors.js';
import { createChildLogger } from '../utils/logger.js';
import type { CreateWebhookInput, UpdateWebhookInput } from '../schemas/webhook.js';
import type { WebhookConfig } from '../types/index.js';

const log = createChildLogger({ module: 'webhook-service' });

// ─── Helpers ─────────────────────────────────────────────────────

function parseWebhook(row: Record<string, unknown>): WebhookConfig {
  return {
    id: row.id as string,
    url: row.url as string,
    secret: (row.secret as string) ?? null,
    events: JSON.parse(row.events as string) as string[],
    isActive: row.isActive as boolean,
  };
}

// ─── Service Methods ─────────────────────────────────────────────

export async function createWebhook(data: CreateWebhookInput): Promise<WebhookConfig> {
  try {
    const secret = data.secret ?? generateSecret();
    const webhook = await prisma.webhook.create({
      data: {
        url: data.url,
        events: JSON.stringify(data.events),
        secret,
        isActive: true,
      },
    });

    log.info({ webhookId: webhook.id, url: data.url }, 'Webhook created');
    return parseWebhook(webhook as unknown as Record<string, unknown>);
  } catch (err) {
    log.error(err, 'Failed to create webhook');
    throw Errors.internal('Failed to create webhook');
  }
}

export async function getAllWebhooks(): Promise<WebhookConfig[]> {
  try {
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return webhooks.map((w) => parseWebhook(w as unknown as Record<string, unknown>));
  } catch (err) {
    log.error(err, 'Failed to fetch webhooks');
    throw Errors.internal('Failed to fetch webhooks');
  }
}

export async function getWebhookById(id: string): Promise<WebhookConfig> {
  try {
    const webhook = await prisma.webhook.findUnique({ where: { id } });

    if (!webhook) {
      throw Errors.notFound('Webhook');
    }

    return parseWebhook(webhook as unknown as Record<string, unknown>);
  } catch (err) {
    if (err instanceof Error && 'statusCode' in err) throw err;
    log.error(err, 'Failed to fetch webhook');
    throw Errors.internal('Failed to fetch webhook');
  }
}

export async function updateWebhook(
  id: string,
  data: UpdateWebhookInput,
): Promise<WebhookConfig> {
  try {
    const existing = await prisma.webhook.findUnique({ where: { id } });
    if (!existing) {
      throw Errors.notFound('Webhook');
    }

    const updateData: Record<string, unknown> = {};
    if (data.url !== undefined) updateData.url = data.url;
    if (data.secret !== undefined) updateData.secret = data.secret;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.events !== undefined) updateData.events = JSON.stringify(data.events);

    const webhook = await prisma.webhook.update({
      where: { id },
      data: updateData,
    });

    log.info({ webhookId: id }, 'Webhook updated');
    return parseWebhook(webhook as unknown as Record<string, unknown>);
  } catch (err) {
    if (err instanceof Error && 'statusCode' in err) throw err;
    log.error(err, 'Failed to update webhook');
    throw Errors.internal('Failed to update webhook');
  }
}

export async function deleteWebhook(id: string): Promise<{ deleted: boolean; id: string }> {
  try {
    const existing = await prisma.webhook.findUnique({ where: { id } });
    if (!existing) {
      throw Errors.notFound('Webhook');
    }

    await prisma.webhook.delete({ where: { id } });

    log.info({ webhookId: id }, 'Webhook deleted');
    return { deleted: true, id };
  } catch (err) {
    if (err instanceof Error && 'statusCode' in err) throw err;
    log.error(err, 'Failed to delete webhook');
    throw Errors.internal('Failed to delete webhook');
  }
}

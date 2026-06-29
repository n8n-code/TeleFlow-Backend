import type { FastifyRequest, FastifyReply } from 'fastify';
import { success } from '../utils/response.js';
import { Errors } from '../utils/errors.js';
import { createWebhookSchema, updateWebhookSchema } from '../schemas/webhook.js';
import * as webhookService from '../services/webhook.service.js';

// ─── Get All Webhooks ────────────────────────────────────────────

export async function handleGetWebhooks(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const result = await webhookService.getAllWebhooks();
  success(reply, result);
}

// ─── Create Webhook ──────────────────────────────────────────────

export async function handleCreateWebhook(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = createWebhookSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await webhookService.createWebhook(parsed.data);
  success(reply, result, 201);
}

// ─── Update Webhook ──────────────────────────────────────────────

export async function handleUpdateWebhook(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { id } = request.params;

  const parsed = updateWebhookSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await webhookService.updateWebhook(id, parsed.data);
  success(reply, result);
}

// ─── Delete Webhook ──────────────────────────────────────────────

export async function handleDeleteWebhook(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { id } = request.params;
  const result = await webhookService.deleteWebhook(id);
  success(reply, result);
}

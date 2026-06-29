import type { FastifyRequest, FastifyReply } from 'fastify';
import { success } from '../utils/response.js';
import { Errors } from '../utils/errors.js';
import {
  sendMessageSchema,
  editMessageSchema,
  deleteMessageSchema,
  forwardMessageSchema,
  reactMessageSchema,
  pinMessageSchema,
  readMessagesSchema,
  getHistorySchema,
} from '../schemas/message.js';
import * as messageService from '../services/message.service.js';

// ─── Send Message ────────────────────────────────────────────────

export async function handleSendMessage(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = sendMessageSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await messageService.sendMessage(parsed.data);
  success(reply, result, 201);
}

// ─── Reply Message ───────────────────────────────────────────────

export async function handleReplyMessage(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = sendMessageSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  if (!parsed.data.replyToMsgId) {
    throw Errors.badRequest('replyToMsgId is required for reply');
  }

  const result = await messageService.sendMessage(parsed.data);
  success(reply, result, 201);
}

// ─── Edit Message ────────────────────────────────────────────────

export async function handleEditMessage(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = editMessageSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await messageService.editMessage(parsed.data);
  success(reply, result);
}

// ─── Delete Messages ─────────────────────────────────────────────

export async function handleDeleteMessages(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = deleteMessageSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await messageService.deleteMessages(parsed.data);
  success(reply, result);
}

// ─── Forward Messages ────────────────────────────────────────────

export async function handleForwardMessages(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = forwardMessageSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await messageService.forwardMessages(parsed.data);
  success(reply, result);
}

// ─── React to Message ────────────────────────────────────────────

export async function handleReactToMessage(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = reactMessageSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await messageService.reactToMessage(parsed.data);
  success(reply, result);
}

// ─── Pin Message ─────────────────────────────────────────────────

export async function handlePinMessage(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = pinMessageSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await messageService.pinMessage(parsed.data);
  success(reply, result);
}

// ─── Unpin Message ───────────────────────────────────────────────

export async function handleUnpinMessage(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = pinMessageSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await messageService.unpinMessage(parsed.data);
  success(reply, result);
}

// ─── Mark as Read ────────────────────────────────────────────────

export async function handleMarkAsRead(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = readMessagesSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await messageService.markAsRead(parsed.data);
  success(reply, result);
}

// ─── Get History ─────────────────────────────────────────────────

export async function handleGetHistory(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = getHistorySchema.safeParse(request.query);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await messageService.getHistory(parsed.data);
  success(reply, result);
}

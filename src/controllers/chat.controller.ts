import type { FastifyRequest, FastifyReply } from 'fastify';
import { success } from '../utils/response.js';
import { Errors } from '../utils/errors.js';
import {
  getChatParamsSchema,
  chatQuerySchema,
  joinChatSchema,
  leaveChatSchema,
  getMembersQuerySchema,
  searchMessagesSchema,
} from '../schemas/chat.js';
import * as chatService from '../services/chat.service.js';

// ─── Get Chats ───────────────────────────────────────────────────

export async function handleGetChats(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = chatQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await chatService.getChats(parsed.data.sessionId);
  success(reply, result);
}

// ─── Get Chat by ID ──────────────────────────────────────────────

export async function handleGetChat(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const paramsParsed = getChatParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw Errors.validationError(paramsParsed.error.flatten().fieldErrors);
  }

  const queryParsed = chatQuerySchema.safeParse(request.query);
  if (!queryParsed.success) {
    throw Errors.validationError(queryParsed.error.flatten().fieldErrors);
  }

  const result = await chatService.getChat(queryParsed.data.sessionId, paramsParsed.data.id);
  success(reply, result);
}

// ─── Join Chat ───────────────────────────────────────────────────

export async function handleJoinChat(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = joinChatSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await chatService.joinChat(parsed.data.sessionId, parsed.data.chatId);
  success(reply, result);
}

// ─── Leave Chat ──────────────────────────────────────────────────

export async function handleLeaveChat(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = leaveChatSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await chatService.leaveChat(parsed.data.sessionId, parsed.data.chatId);
  success(reply, result);
}

// ─── Get Members ─────────────────────────────────────────────────

export async function handleGetMembers(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const paramsParsed = getChatParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw Errors.validationError(paramsParsed.error.flatten().fieldErrors);
  }

  const queryParsed = getMembersQuerySchema.safeParse(request.query);
  if (!queryParsed.success) {
    throw Errors.validationError(queryParsed.error.flatten().fieldErrors);
  }

  const result = await chatService.getMembers(
    queryParsed.data.sessionId,
    paramsParsed.data.id,
    queryParsed.data.limit,
    queryParsed.data.offset,
  );
  success(reply, result);
}

// ─── Search Messages ─────────────────────────────────────────────

export async function handleSearchMessages(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = searchMessagesSchema.safeParse(request.body);
  if (!parsed.success) {
    throw Errors.validationError(parsed.error.flatten().fieldErrors);
  }

  const result = await chatService.searchMessages(
    parsed.data.sessionId,
    parsed.data.chatId,
    parsed.data.query,
    parsed.data.limit,
  );
  success(reply, result);
}

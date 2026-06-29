import type { FastifyRequest, FastifyReply } from 'fastify';
import { success } from '../utils/response.js';
import * as sessionService from '../services/session.service.js';
import type {
  CreateSessionInput,
  VerifyCodeInput,
  VerifyPasswordInput,
  ImportSessionInput,
  SessionIdParams,
} from '../schemas/session.js';

// ─── Create Session ──────────────────────────────────────────────

export async function handleCreateSession(
  request: FastifyRequest<{ Body: CreateSessionInput }>,
  reply: FastifyReply,
): Promise<void> {
  const { name, phoneNumber } = request.body;
  const result = await sessionService.createSession(name, phoneNumber);
  success(reply, result, 201);
}

// ─── Verify Code ─────────────────────────────────────────────────

export async function handleVerifyCode(
  request: FastifyRequest<{ Body: VerifyCodeInput }>,
  reply: FastifyReply,
): Promise<void> {
  const { sessionId, phoneCode, phoneCodeHash } = request.body;
  const result = await sessionService.verifyCode(sessionId, phoneCode, phoneCodeHash);
  success(reply, result);
}

// ─── Verify Password ────────────────────────────────────────────

export async function handleVerifyPassword(
  request: FastifyRequest<{ Body: VerifyPasswordInput }>,
  reply: FastifyReply,
): Promise<void> {
  const { sessionId, password } = request.body;
  const result = await sessionService.verifyPassword(sessionId, password);
  success(reply, result);
}

// ─── Import Session ──────────────────────────────────────────────

export async function handleImportSession(
  request: FastifyRequest<{ Body: ImportSessionInput }>,
  reply: FastifyReply,
): Promise<void> {
  const { name, sessionString } = request.body;
  const result = await sessionService.importSession(name, sessionString);
  success(reply, result, 201);
}

// ─── Get Sessions ────────────────────────────────────────────────

export async function handleGetSessions(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const sessions = await sessionService.getSessions();
  success(reply, sessions);
}

// ─── Get Session ─────────────────────────────────────────────────

export async function handleGetSession(
  request: FastifyRequest<{ Params: SessionIdParams }>,
  reply: FastifyReply,
): Promise<void> {
  const session = await sessionService.getSession(request.params.id);
  success(reply, session);
}

// ─── Delete Session ──────────────────────────────────────────────

export async function handleDeleteSession(
  request: FastifyRequest<{ Params: SessionIdParams }>,
  reply: FastifyReply,
): Promise<void> {
  await sessionService.deleteSession(request.params.id);
  success(reply, { message: 'Session deleted' });
}

// ─── Connect Session ─────────────────────────────────────────────

export async function handleConnectSession(
  request: FastifyRequest<{ Params: SessionIdParams }>,
  reply: FastifyReply,
): Promise<void> {
  await sessionService.connectSession(request.params.id);
  success(reply, { message: 'Session connected' });
}

// ─── Disconnect Session ──────────────────────────────────────────

export async function handleDisconnectSession(
  request: FastifyRequest<{ Params: SessionIdParams }>,
  reply: FastifyReply,
): Promise<void> {
  await sessionService.disconnectSession(request.params.id);
  success(reply, { message: 'Session disconnected' });
}

// ─── Export Session ──────────────────────────────────────────────

export async function handleExportSession(
  request: FastifyRequest<{ Params: SessionIdParams }>,
  reply: FastifyReply,
): Promise<void> {
  const result = await sessionService.exportSession(request.params.id);
  success(reply, result);
}

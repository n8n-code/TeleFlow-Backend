import type { FastifyReply, FastifyRequest } from 'fastify';
import { loginSchema } from '../schemas/auth.js';
import * as authService from '../services/auth.service.js';
import { success } from '../utils/response.js';
import { Errors } from '../utils/errors.js';
import type { RequestUser } from '../middlewares/auth.middleware.js';

// ─── Login ───────────────────────────────────────────────────────

export async function handleLogin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = loginSchema.parse(request.body);

  const signJwt = (payload: { sub: string; role: string }, options?: { expiresIn?: string }) =>
    request.server.jwt.sign(payload, options);

  const result = await authService.login(parsed.name, 'user', signJwt);

  success(reply, result, 201);
}

// ─── Get Me ──────────────────────────────────────────────────────

export async function handleGetMe(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = request.user;
  if (!user) {
    throw Errors.unauthorized();
  }

  const me = await authService.getMe(user.id);
  if (!me) {
    throw Errors.notFound('User');
  }

  success(reply, me);
}

// ─── Logout ──────────────────────────────────────────────────────

export async function handleLogout(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = request.user;
  if (!user) {
    throw Errors.unauthorized();
  }

  await authService.logout(user.id);

  success(reply, { message: 'Logged out successfully' });
}

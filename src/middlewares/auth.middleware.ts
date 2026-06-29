import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { prisma } from '../database/prisma.js';
import { Errors } from '../utils/errors.js';
import { createChildLogger } from '../utils/logger.js';
import type { JwtPayload } from '../types/index.js';

const log = createChildLogger({ module: 'auth' });

// ─── Public routes (no auth required) ────────────────────────────

const PUBLIC_ROUTES = ['/health', '/version', '/docs'];

// ─── Request user type ───────────────────────────────────────────

export interface RequestUser {
  id: string;
  name: string;
  role: string;
  method: 'jwt' | 'api_key';
}

// ─── Authenticate pre-handler ────────────────────────────────────

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Skip auth for public routes
  const isPublic = PUBLIC_ROUTES.some((route) => request.url.startsWith(route));
  if (isPublic) {
    return;
  }

  // ─── Try Bearer JWT ────────────────────────────────────────────
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = (request.server as FastifyInstance).jwt.verify<JwtPayload>(token);
      request.user = {
        id: payload.sub,
        name: payload.sub,
        role: payload.role,
        method: 'jwt',
      };
      return;
    } catch {
      log.debug('JWT verification failed');
      // Fall through to API key check
    }
  }

  // ─── Try API Key ───────────────────────────────────────────────
  const apiKey = request.headers['x-api-key'] as string | undefined;
  if (apiKey) {
    const keyRecord = await prisma.apiKey.findFirst({
      where: { key: apiKey, isActive: true },
    });

    if (keyRecord) {
      request.user = {
        id: keyRecord.id,
        name: keyRecord.name,
        role: keyRecord.role,
        method: 'api_key',
      };
      return;
    }

    log.debug('API key not found or inactive');
  }

  // ─── No valid auth ─────────────────────────────────────────────
  throw Errors.unauthorized('Missing or invalid authentication');
}

// ─── Auth plugin ─────────────────────────────────────────────────

async function authPluginFn(fastify: FastifyInstance): Promise<void> {
  // Decorate request with user property
  fastify.decorateRequest('user', null as unknown as RequestUser);

  // Decorate fastify with authenticate function for route-level usage
  fastify.decorate('authenticate', authenticate);

  // Add global pre-handler
  fastify.addHook('preHandler', authenticate);
}

export const authPlugin = fp(authPluginFn, {
  name: 'auth-plugin',
  fastify: '5.x',
});

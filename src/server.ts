import Fastify, { type FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';

// ─── Plugins ─────────────────────────────────────────────────────
import corsPlugin from './plugins/cors.plugin.js';
import helmetPlugin from './plugins/helmet.plugin.js';
import swaggerPlugin from './plugins/swagger.plugin.js';

// ─── Middlewares ─────────────────────────────────────────────────
import { authPlugin } from './middlewares/auth.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

// ─── Routes ──────────────────────────────────────────────────────
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import sessionRoutes from './routes/session.routes.js';
import messageRoutes from './routes/message.routes.js';
import chatRoutes from './routes/chat.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import eventRoutes from './routes/event.routes.js';

// ─── Config ──────────────────────────────────────────────────────
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

// ─── Fastify type augmentation ───────────────────────────────────

import type { RequestUser } from './middlewares/auth.middleware.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: RequestUser;
  }

  interface FastifyInstance {
    authenticate: (
      request: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply,
    ) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: string };
    user: RequestUser;
  }
}

// ─── Build Server ────────────────────────────────────────────────

export async function buildServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' } }
          : undefined,
    },
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
  });

  // ─── Error Handler ───────────────────────────────────────────
  fastify.setErrorHandler(errorHandler);

  // ─── Security & CORS Plugins ─────────────────────────────────
  await fastify.register(corsPlugin);
  await fastify.register(helmetPlugin);

  // ─── Swagger (register before routes so schemas are captured) ─
  await fastify.register(swaggerPlugin);

  // ─── JWT ─────────────────────────────────────────────────────
  await fastify.register(jwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: '7d' },
  });

  // ─── Rate Limiting ──────────────────────────────────────────
  await fastify.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
  });

  // ─── WebSocket ──────────────────────────────────────────────
  await fastify.register(websocket);

  // ─── Auth Plugin (global preHandler) ─────────────────────────
  await fastify.register(authPlugin);

  // ─── Health Routes (root, no prefix) ─────────────────────────
  await fastify.register(healthRoutes);

  // ─── API v1 Routes ──────────────────────────────────────────
  await fastify.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(sessionRoutes);
      await api.register(messageRoutes);
      await api.register(chatRoutes);
      await api.register(webhookRoutes);
      await api.register(eventRoutes);
    },
    { prefix: '/api/v1' },
  );

  // ─── Ready Hook — log all registered routes ──────────────────
  fastify.addHook('onReady', async () => {
    const routes = fastify.printRoutes({ commonPrefix: false });
    logger.info(`Registered routes:\n${routes}`);
  });

  return fastify;
}

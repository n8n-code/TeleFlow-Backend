import type { FastifyInstance } from 'fastify';
import { handleLogin, handleGetMe, handleLogout } from '../controllers/auth.controller.js';
import { loginJsonSchema, meJsonSchema, logoutJsonSchema } from '../schemas/auth.js';

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /auth/login — public (no auth required)
  fastify.post('/auth/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Login and generate API key + JWT',
      security: [],
      ...loginJsonSchema,
    },
    preHandler: [], // Override global auth — this route is public
    handler: handleLogin,
  });

  // POST /auth/logout — requires auth
  fastify.post('/auth/logout', {
    schema: {
      tags: ['Auth'],
      summary: 'Logout (deactivate API key)',
      ...logoutJsonSchema,
    },
    handler: handleLogout,
  });

  // GET /auth/me — requires auth
  fastify.get('/auth/me', {
    schema: {
      tags: ['Auth'],
      summary: 'Get current user info',
      ...meJsonSchema,
    },
    handler: handleGetMe,
  });
}

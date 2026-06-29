import type { FastifyInstance } from 'fastify';
import { sessionManager } from '../telegram/session-manager.js';
import { success } from '../utils/response.js';

export default async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /health
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check',
      security: [],
      response: {
        200: {
          type: 'object' as const,
          properties: {
            success: { type: 'boolean' as const },
            data: {
              type: 'object' as const,
              properties: {
                status: { type: 'string' as const },
                uptime: { type: 'number' as const },
                timestamp: { type: 'string' as const },
                sessions: {
                  type: 'object' as const,
                  properties: {
                    active: { type: 'number' as const },
                  },
                },
              },
            },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      success(reply, {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        sessions: {
          active: sessionManager.getAllSessions().length,
        },
      });
    },
  });

  // GET /version
  fastify.get('/version', {
    schema: {
      tags: ['Health'],
      summary: 'API version info',
      security: [],
      response: {
        200: {
          type: 'object' as const,
          properties: {
            success: { type: 'boolean' as const },
            data: {
              type: 'object' as const,
              properties: {
                name: { type: 'string' as const },
                version: { type: 'string' as const },
                runtime: { type: 'string' as const },
              },
            },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      success(reply, {
        name: 'TeleFlow',
        version: '0.1.0',
        runtime: `Node.js ${process.version}`,
      });
    },
  });
}

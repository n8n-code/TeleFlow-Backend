import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  handleCreateSession,
  handleVerifyCode,
  handleVerifyPassword,
  handleImportSession,
  handleGetSessions,
  handleGetSession,
  handleDeleteSession,
  handleConnectSession,
  handleDisconnectSession,
  handleExportSession,
} from '../controllers/session.controller.js';
import {
  createSessionJsonSchema,
  verifyCodeJsonSchema,
  verifyPasswordJsonSchema,
  importSessionJsonSchema,
  sessionIdParamsJsonSchema,
  sessionResponseSchema,
  sessionLoginStateResponseSchema,
  sessionsListResponseSchema,
  errorResponseSchema,
} from '../schemas/session.js';

// ─── Reusable response schemas ───────────────────────────────────

const messageResponseSchema = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: {
      type: 'object' as const,
      properties: {
        message: { type: 'string' as const },
      },
    },
  },
} as const;

const sessionStringResponseSchema = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: {
      type: 'object' as const,
      properties: {
        sessionString: { type: 'string' as const },
      },
    },
  },
} as const;

const sessionIdResponseSchema = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: {
      type: 'object' as const,
      properties: {
        sessionId: { type: 'string' as const },
      },
    },
  },
} as const;

// ─── Session Routes Plugin ───────────────────────────────────────

const sessionRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // ─── GET /sessions ─────────────────────────────────────────────
  fastify.get('/sessions', {
    schema: {
      tags: ['Sessions'],
      summary: 'List all sessions',
      response: {
        200: sessionsListResponseSchema,
      },
    },
    handler: handleGetSessions,
  });

  // ─── POST /sessions ────────────────────────────────────────────
  fastify.post('/sessions', {
    schema: {
      tags: ['Sessions'],
      summary: 'Create a new session and start login flow',
      body: createSessionJsonSchema,
      response: {
        201: sessionLoginStateResponseSchema,
        400: errorResponseSchema,
        502: errorResponseSchema,
      },
    },
    handler: handleCreateSession,
  });

  // ─── GET /sessions/:id ─────────────────────────────────────────
  fastify.get('/sessions/:id', {
    schema: {
      tags: ['Sessions'],
      summary: 'Get session details',
      params: sessionIdParamsJsonSchema,
      response: {
        200: sessionResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: handleGetSession,
  });

  // ─── DELETE /sessions/:id ──────────────────────────────────────
  fastify.delete('/sessions/:id', {
    schema: {
      tags: ['Sessions'],
      summary: 'Delete a session',
      params: sessionIdParamsJsonSchema,
      response: {
        200: messageResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: handleDeleteSession,
  });

  // ─── POST /sessions/:id/connect ────────────────────────────────
  fastify.post('/sessions/:id/connect', {
    schema: {
      tags: ['Sessions'],
      summary: 'Connect an existing session',
      params: sessionIdParamsJsonSchema,
      response: {
        200: messageResponseSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: handleConnectSession,
  });

  // ─── POST /sessions/:id/disconnect ─────────────────────────────
  fastify.post('/sessions/:id/disconnect', {
    schema: {
      tags: ['Sessions'],
      summary: 'Disconnect a session',
      params: sessionIdParamsJsonSchema,
      response: {
        200: messageResponseSchema,
        400: errorResponseSchema,
      },
    },
    handler: handleDisconnectSession,
  });

  // ─── POST /sessions/:id/export ─────────────────────────────────
  fastify.post('/sessions/:id/export', {
    schema: {
      tags: ['Sessions'],
      summary: 'Export session string',
      params: sessionIdParamsJsonSchema,
      response: {
        200: sessionStringResponseSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: handleExportSession,
  });

  // ─── POST /sessions/import ─────────────────────────────────────
  fastify.post('/sessions/import', {
    schema: {
      tags: ['Sessions'],
      summary: 'Import an existing session string',
      body: importSessionJsonSchema,
      response: {
        201: sessionIdResponseSchema,
        400: errorResponseSchema,
        502: errorResponseSchema,
      },
    },
    handler: handleImportSession,
  });

  // ─── POST /sessions/verify-code ────────────────────────────────
  fastify.post('/sessions/verify-code', {
    schema: {
      tags: ['Sessions'],
      summary: 'Verify phone code during login',
      body: verifyCodeJsonSchema,
      response: {
        200: sessionLoginStateResponseSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
        502: errorResponseSchema,
      },
    },
    handler: handleVerifyCode,
  });

  // ─── POST /sessions/verify-password ────────────────────────────
  fastify.post('/sessions/verify-password', {
    schema: {
      tags: ['Sessions'],
      summary: 'Verify 2FA password during login',
      body: verifyPasswordJsonSchema,
      response: {
        200: sessionLoginStateResponseSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
        502: errorResponseSchema,
      },
    },
    handler: handleVerifyPassword,
  });
};

export default sessionRoutes;

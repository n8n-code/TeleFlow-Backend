import type { FastifyInstance } from 'fastify';
import {
  handleGetChats,
  handleGetChat,
  handleJoinChat,
  handleLeaveChat,
  handleGetMembers,
  handleSearchMessages,
} from '../controllers/chat.controller.js';

export default async function chatRoutes(fastify: FastifyInstance): Promise<void> {
  // ─── GET /chats ──────────────────────────────────────────────
  fastify.get('/chats', {
    schema: {
      tags: ['Chats'],
      summary: 'Get all chats',
      description: 'Retrieve all dialogs/chats for a session',
      querystring: {
        type: 'object',
        required: ['sessionId'],
        properties: {
          sessionId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
          },
        },
      },
    },
    handler: handleGetChats,
  });

  // ─── GET /chats/:id ─────────────────────────────────────────
  fastify.get('/chats/:id', {
    schema: {
      tags: ['Chats'],
      summary: 'Get chat by ID',
      description: 'Retrieve details of a specific chat',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        required: ['sessionId'],
        properties: {
          sessionId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: handleGetChat,
  });

  // ─── POST /chats/join ────────────────────────────────────────
  fastify.post('/chats/join', {
    schema: {
      tags: ['Chats'],
      summary: 'Join a chat',
      description: 'Join a channel or supergroup',
      body: {
        type: 'object',
        required: ['sessionId', 'chatId'],
        properties: {
          sessionId: { type: 'string' },
          chatId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: handleJoinChat,
  });

  // ─── POST /chats/leave ───────────────────────────────────────
  fastify.post('/chats/leave', {
    schema: {
      tags: ['Chats'],
      summary: 'Leave a chat',
      description: 'Leave a channel or supergroup',
      body: {
        type: 'object',
        required: ['sessionId', 'chatId'],
        properties: {
          sessionId: { type: 'string' },
          chatId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: handleLeaveChat,
  });

  // ─── GET /chats/:id/members ──────────────────────────────────
  fastify.get('/chats/:id/members', {
    schema: {
      tags: ['Chats'],
      summary: 'Get chat members',
      description: 'Retrieve participants of a chat',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        required: ['sessionId'],
        properties: {
          sessionId: { type: 'string' },
          limit: { type: 'number', default: 100 },
          offset: { type: 'number', default: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
          },
        },
      },
    },
    handler: handleGetMembers,
  });

  // ─── POST /chats/search ──────────────────────────────────────
  fastify.post('/chats/search', {
    schema: {
      tags: ['Chats'],
      summary: 'Search messages in chat',
      description: 'Search for messages within a specific chat',
      body: {
        type: 'object',
        required: ['sessionId', 'chatId', 'query'],
        properties: {
          sessionId: { type: 'string' },
          chatId: { type: 'string' },
          query: { type: 'string' },
          limit: { type: 'number', default: 20 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
          },
        },
      },
    },
    handler: handleSearchMessages,
  });
}

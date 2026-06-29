import type { FastifyInstance } from 'fastify';
import {
  handleSendMessage,
  handleReplyMessage,
  handleEditMessage,
  handleDeleteMessages,
  handleForwardMessages,
  handleReactToMessage,
  handlePinMessage,
  handleUnpinMessage,
  handleMarkAsRead,
  handleGetHistory,
} from '../controllers/message.controller.js';

export default async function messageRoutes(fastify: FastifyInstance): Promise<void> {
  // ─── POST /messages/send ─────────────────────────────────────
  fastify.post('/messages/send', {
    schema: {
      tags: ['Messages'],
      summary: 'Send a message',
      description: 'Send a new message to a Telegram chat',
      body: {
        type: 'object',
        required: ['sessionId', 'chatId', 'text'],
        properties: {
          sessionId: { type: 'string' },
          chatId: { type: 'string' },
          text: { type: 'string', minLength: 1 },
          replyToMsgId: { type: 'number' },
          schedule: { type: 'number' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: handleSendMessage,
  });

  // ─── POST /messages/reply ────────────────────────────────────
  fastify.post('/messages/reply', {
    schema: {
      tags: ['Messages'],
      summary: 'Reply to a message',
      description: 'Reply to an existing message in a chat',
      body: {
        type: 'object',
        required: ['sessionId', 'chatId', 'text', 'replyToMsgId'],
        properties: {
          sessionId: { type: 'string' },
          chatId: { type: 'string' },
          text: { type: 'string', minLength: 1 },
          replyToMsgId: { type: 'number' },
          schedule: { type: 'number' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: handleReplyMessage,
  });

  // ─── POST /messages/edit ─────────────────────────────────────
  fastify.post('/messages/edit', {
    schema: {
      tags: ['Messages'],
      summary: 'Edit a message',
      description: 'Edit an existing message text',
      body: {
        type: 'object',
        required: ['sessionId', 'chatId', 'messageId', 'text'],
        properties: {
          sessionId: { type: 'string' },
          chatId: { type: 'string' },
          messageId: { type: 'number' },
          text: { type: 'string', minLength: 1 },
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
    handler: handleEditMessage,
  });

  // ─── POST /messages/delete ───────────────────────────────────
  fastify.post('/messages/delete', {
    schema: {
      tags: ['Messages'],
      summary: 'Delete messages',
      description: 'Delete one or more messages from a chat',
      body: {
        type: 'object',
        required: ['sessionId', 'chatId', 'messageIds'],
        properties: {
          sessionId: { type: 'string' },
          chatId: { type: 'string' },
          messageIds: { type: 'array', items: { type: 'number' }, minItems: 1 },
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
    handler: handleDeleteMessages,
  });

  // ─── POST /messages/forward ──────────────────────────────────
  fastify.post('/messages/forward', {
    schema: {
      tags: ['Messages'],
      summary: 'Forward messages',
      description: 'Forward messages from one chat to another',
      body: {
        type: 'object',
        required: ['sessionId', 'fromChatId', 'toChatId', 'messageIds'],
        properties: {
          sessionId: { type: 'string' },
          fromChatId: { type: 'string' },
          toChatId: { type: 'string' },
          messageIds: { type: 'array', items: { type: 'number' }, minItems: 1 },
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
    handler: handleForwardMessages,
  });

  // ─── POST /messages/react ────────────────────────────────────
  fastify.post('/messages/react', {
    schema: {
      tags: ['Messages'],
      summary: 'React to a message',
      description: 'Add an emoji reaction to a message',
      body: {
        type: 'object',
        required: ['sessionId', 'chatId', 'messageId', 'emoji'],
        properties: {
          sessionId: { type: 'string' },
          chatId: { type: 'string' },
          messageId: { type: 'number' },
          emoji: { type: 'string' },
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
    handler: handleReactToMessage,
  });

  // ─── POST /messages/pin ──────────────────────────────────────
  fastify.post('/messages/pin', {
    schema: {
      tags: ['Messages'],
      summary: 'Pin a message',
      description: 'Pin a message in a chat',
      body: {
        type: 'object',
        required: ['sessionId', 'chatId', 'messageId'],
        properties: {
          sessionId: { type: 'string' },
          chatId: { type: 'string' },
          messageId: { type: 'number' },
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
    handler: handlePinMessage,
  });

  // ─── POST /messages/unpin ────────────────────────────────────
  fastify.post('/messages/unpin', {
    schema: {
      tags: ['Messages'],
      summary: 'Unpin a message',
      description: 'Unpin a message in a chat',
      body: {
        type: 'object',
        required: ['sessionId', 'chatId', 'messageId'],
        properties: {
          sessionId: { type: 'string' },
          chatId: { type: 'string' },
          messageId: { type: 'number' },
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
    handler: handleUnpinMessage,
  });

  // ─── POST /messages/read ─────────────────────────────────────
  fastify.post('/messages/read', {
    schema: {
      tags: ['Messages'],
      summary: 'Mark messages as read',
      description: 'Mark all messages in a chat as read',
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
    handler: handleMarkAsRead,
  });

  // ─── GET /messages/history ───────────────────────────────────
  fastify.get('/messages/history', {
    schema: {
      tags: ['Messages'],
      summary: 'Get message history',
      description: 'Retrieve message history for a chat',
      querystring: {
        type: 'object',
        required: ['sessionId', 'chatId'],
        properties: {
          sessionId: { type: 'string' },
          chatId: { type: 'string' },
          limit: { type: 'number', default: 50 },
          offsetId: { type: 'number', default: 0 },
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
    handler: handleGetHistory,
  });
}

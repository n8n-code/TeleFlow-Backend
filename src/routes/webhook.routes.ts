import type { FastifyInstance } from 'fastify';
import {
  handleGetWebhooks,
  handleCreateWebhook,
  handleUpdateWebhook,
  handleDeleteWebhook,
} from '../controllers/webhook.controller.js';

export default async function webhookRoutes(fastify: FastifyInstance): Promise<void> {
  // ─── GET /webhooks ───────────────────────────────────────────
  fastify.get('/webhooks', {
    schema: {
      tags: ['Webhooks'],
      summary: 'List all webhooks',
      description: 'Retrieve all registered webhook configurations',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  url: { type: 'string' },
                  secret: { type: 'string', nullable: true },
                  events: { type: 'array', items: { type: 'string' } },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    handler: handleGetWebhooks,
  });

  // ─── POST /webhooks ──────────────────────────────────────────
  fastify.post('/webhooks', {
    schema: {
      tags: ['Webhooks'],
      summary: 'Create a webhook',
      description: 'Register a new webhook endpoint',
      body: {
        type: 'object',
        required: ['url', 'events'],
        properties: {
          url: { type: 'string', format: 'uri' },
          events: { type: 'array', items: { type: 'string' }, minItems: 1 },
          secret: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                url: { type: 'string' },
                secret: { type: 'string', nullable: true },
                events: { type: 'array', items: { type: 'string' } },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    handler: handleCreateWebhook,
  });

  // ─── PUT /webhooks/:id ───────────────────────────────────────
  fastify.put('/webhooks/:id', {
    schema: {
      tags: ['Webhooks'],
      summary: 'Update a webhook',
      description: 'Update an existing webhook configuration',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          events: { type: 'array', items: { type: 'string' } },
          secret: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                url: { type: 'string' },
                secret: { type: 'string', nullable: true },
                events: { type: 'array', items: { type: 'string' } },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    handler: handleUpdateWebhook,
  });

  // ─── DELETE /webhooks/:id ────────────────────────────────────
  fastify.delete('/webhooks/:id', {
    schema: {
      tags: ['Webhooks'],
      summary: 'Delete a webhook',
      description: 'Remove a registered webhook',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                deleted: { type: 'boolean' },
                id: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: handleDeleteWebhook,
  });
}

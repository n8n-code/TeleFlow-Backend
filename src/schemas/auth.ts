import { z } from 'zod';

// ─── Zod Schemas ─────────────────────────────────────────────────

export const loginSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── JSON Schema versions for Fastify route schemas ──────────────

export const loginJsonSchema = {
  body: {
    type: 'object' as const,
    required: ['name'],
    properties: {
      name: { type: 'string' as const, minLength: 1 },
    },
  },
  response: {
    200: {
      type: 'object' as const,
      properties: {
        success: { type: 'boolean' as const },
        data: {
          type: 'object' as const,
          properties: {
            apiKey: { type: 'string' as const },
            jwt: { type: 'string' as const },
            role: { type: 'string' as const },
          },
        },
      },
    },
  },
};

export const meJsonSchema = {
  response: {
    200: {
      type: 'object' as const,
      properties: {
        success: { type: 'boolean' as const },
        data: {
          type: 'object' as const,
          properties: {
            id: { type: 'string' as const },
            name: { type: 'string' as const },
            role: { type: 'string' as const },
            isActive: { type: 'boolean' as const },
            createdAt: { type: 'string' as const },
          },
        },
      },
    },
  },
};

export const logoutJsonSchema = {
  response: {
    200: {
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
    },
  },
};

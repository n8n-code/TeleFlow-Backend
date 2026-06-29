import { z } from 'zod';

// ─── Zod Schemas ─────────────────────────────────────────────────

export const createSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
});

export const verifyCodeSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  phoneCode: z.string().min(1, 'Phone code is required'),
  phoneCodeHash: z.string().min(1, 'Phone code hash is required'),
});

export const verifyPasswordSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export const importSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
  sessionString: z.string().min(1, 'Session string is required'),
});

export const sessionIdParamsSchema = z.object({
  id: z.string().min(1),
});

// ─── Inferred Types ──────────────────────────────────────────────

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
export type VerifyPasswordInput = z.infer<typeof verifyPasswordSchema>;
export type ImportSessionInput = z.infer<typeof importSessionSchema>;
export type SessionIdParams = z.infer<typeof sessionIdParamsSchema>;

// ─── JSON Schemas for Fastify Route Validation ───────────────────
// Manual conversion compatible with Fastify's Ajv-based validation

export const createSessionJsonSchema = {
  type: 'object' as const,
  required: ['name', 'phoneNumber'],
  properties: {
    name: { type: 'string' as const, minLength: 1, description: 'Session name' },
    phoneNumber: { type: 'string' as const, minLength: 1, description: 'Phone number with country code' },
  },
  additionalProperties: false,
} as const;

export const verifyCodeJsonSchema = {
  type: 'object' as const,
  required: ['sessionId', 'phoneCode', 'phoneCodeHash'],
  properties: {
    sessionId: { type: 'string' as const, minLength: 1, description: 'Session ID' },
    phoneCode: { type: 'string' as const, minLength: 1, description: 'Verification code received via Telegram' },
    phoneCodeHash: { type: 'string' as const, minLength: 1, description: 'Phone code hash from sendCode response' },
  },
  additionalProperties: false,
} as const;

export const verifyPasswordJsonSchema = {
  type: 'object' as const,
  required: ['sessionId', 'password'],
  properties: {
    sessionId: { type: 'string' as const, minLength: 1, description: 'Session ID' },
    password: { type: 'string' as const, minLength: 1, description: 'Two-factor authentication password' },
  },
  additionalProperties: false,
} as const;

export const importSessionJsonSchema = {
  type: 'object' as const,
  required: ['name', 'sessionString'],
  properties: {
    name: { type: 'string' as const, minLength: 1, description: 'Session name' },
    sessionString: { type: 'string' as const, minLength: 1, description: 'GramJS session string' },
  },
  additionalProperties: false,
} as const;

export const sessionIdParamsJsonSchema = {
  type: 'object' as const,
  required: ['id'],
  properties: {
    id: { type: 'string' as const, minLength: 1, description: 'Session ID' },
  },
} as const;

// ─── Response Schemas ────────────────────────────────────────────

export const sessionResponseSchema = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: {
      type: 'object' as const,
      properties: {
        id: { type: 'string' as const },
        name: { type: 'string' as const },
        phoneNumber: { type: 'string' as const },
        isActive: { type: 'boolean' as const },
        isAuthorized: { type: 'boolean' as const },
        createdAt: { type: 'string' as const },
        lastConnected: { type: 'string' as const, nullable: true },
      },
    },
  },
} as const;

export const sessionLoginStateResponseSchema = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: {
      type: 'object' as const,
      properties: {
        sessionId: { type: 'string' as const },
        step: {
          type: 'string' as const,
          enum: ['PHONE_REQUIRED', 'CODE_REQUIRED', 'PASSWORD_REQUIRED', 'LOGGED_IN'],
        },
        phoneCodeHash: { type: 'string' as const },
      },
    },
  },
} as const;

export const sessionsListResponseSchema = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: {
      type: 'array' as const,
      items: sessionResponseSchema.properties.data,
    },
  },
} as const;

export const errorResponseSchema = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    error: {
      type: 'object' as const,
      properties: {
        code: { type: 'string' as const },
        message: { type: 'string' as const },
        details: {},
      },
    },
  },
} as const;

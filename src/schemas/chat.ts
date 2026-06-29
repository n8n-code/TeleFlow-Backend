import { z } from 'zod';

// ─── Chat Schemas ────────────────────────────────────────────────

export const getChatParamsSchema = z.object({
  id: z.string(),
});

export const chatQuerySchema = z.object({
  sessionId: z.string(),
});

export const joinChatSchema = z.object({
  sessionId: z.string(),
  chatId: z.string(),
});

export const leaveChatSchema = z.object({
  sessionId: z.string(),
  chatId: z.string(),
});

export const getMembersQuerySchema = z.object({
  sessionId: z.string(),
  limit: z.coerce.number().default(100),
  offset: z.coerce.number().default(0),
});

export const searchMessagesSchema = z.object({
  sessionId: z.string(),
  chatId: z.string(),
  query: z.string(),
  limit: z.coerce.number().default(20),
});

// ─── Inferred Types ──────────────────────────────────────────────

export type GetChatParams = z.infer<typeof getChatParamsSchema>;
export type ChatQuery = z.infer<typeof chatQuerySchema>;
export type JoinChatInput = z.infer<typeof joinChatSchema>;
export type LeaveChatInput = z.infer<typeof leaveChatSchema>;
export type GetMembersQuery = z.infer<typeof getMembersQuerySchema>;
export type SearchMessagesInput = z.infer<typeof searchMessagesSchema>;

import { z } from 'zod';

// ─── Message Schemas ─────────────────────────────────────────────

export const sendMessageSchema = z.object({
  sessionId: z.string(),
  chatId: z.string(),
  text: z.string().min(1),
  replyToMsgId: z.number().optional(),
  schedule: z.number().optional(),
});

export const editMessageSchema = z.object({
  sessionId: z.string(),
  chatId: z.string(),
  messageId: z.number(),
  text: z.string().min(1),
});

export const deleteMessageSchema = z.object({
  sessionId: z.string(),
  chatId: z.string(),
  messageIds: z.array(z.number()).min(1),
});

export const forwardMessageSchema = z.object({
  sessionId: z.string(),
  fromChatId: z.string(),
  toChatId: z.string(),
  messageIds: z.array(z.number()).min(1),
});

export const reactMessageSchema = z.object({
  sessionId: z.string(),
  chatId: z.string(),
  messageId: z.number(),
  emoji: z.string(),
});

export const pinMessageSchema = z.object({
  sessionId: z.string(),
  chatId: z.string(),
  messageId: z.number(),
});

export const readMessagesSchema = z.object({
  sessionId: z.string(),
  chatId: z.string(),
});

export const getHistorySchema = z.object({
  sessionId: z.string(),
  chatId: z.string(),
  limit: z.coerce.number().default(50),
  offsetId: z.coerce.number().default(0),
});

// ─── Inferred Types ──────────────────────────────────────────────

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;
export type ForwardMessageInput = z.infer<typeof forwardMessageSchema>;
export type ReactMessageInput = z.infer<typeof reactMessageSchema>;
export type PinMessageInput = z.infer<typeof pinMessageSchema>;
export type ReadMessagesInput = z.infer<typeof readMessagesSchema>;
export type GetHistoryInput = z.infer<typeof getHistorySchema>;

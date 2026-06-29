import { Api } from 'telegram/tl/index.js';
import { sessionManager } from '../telegram/session-manager.js';
import { Errors } from '../utils/errors.js';
import { createChildLogger } from '../utils/logger.js';
import { emitEvent } from '../events/emit.js';
import type { TelegramMessage } from '../types/index.js';
import type {
  SendMessageInput,
  EditMessageInput,
  DeleteMessageInput,
  ForwardMessageInput,
  ReactMessageInput,
  PinMessageInput,
  ReadMessagesInput,
  GetHistoryInput,
} from '../schemas/message.js';

const log = createChildLogger({ module: 'message-service' });

// ─── Helpers ─────────────────────────────────────────────────────

function formatMessage(msg: Api.Message): TelegramMessage {
  return {
    id: msg.id,
    chatId: msg.peerId ? String(msg.peerId) : '',
    senderId: msg.fromId ? String(msg.fromId) : '',
    text: msg.message ?? '',
    date: msg.date ?? 0,
    editDate: msg.editDate ?? undefined,
    replyToMsgId: msg.replyTo?.replyToMsgId ?? undefined,
    forwardFrom: msg.fwdFrom ? String(msg.fwdFrom.fromId) : undefined,
  };
}

// ─── Service Methods ─────────────────────────────────────────────

export async function sendMessage(params: SendMessageInput) {
  try {
    const client = await sessionManager.getClient(params.sessionId);
    const result = await client.sendMessage(params.chatId, {
      message: params.text,
      replyTo: params.replyToMsgId,
      schedule: params.schedule,
    });

    log.info({ sessionId: params.sessionId, chatId: params.chatId }, 'Message sent');
    const formatted = formatMessage(result as Api.Message);
    emitEvent('message.sent', params.sessionId, { ...formatted });
    return formatted;
  } catch (err) {
    log.error(err, 'Failed to send message');
    throw Errors.telegramError('Failed to send message', (err as Error).message);
  }
}

export async function editMessage(params: EditMessageInput) {
  try {
    const client = await sessionManager.getClient(params.sessionId);
    const result = await client.editMessage(params.chatId, {
      message: params.messageId,
      text: params.text,
    });

    log.info({ sessionId: params.sessionId, messageId: params.messageId }, 'Message edited');
    const formatted = formatMessage(result as Api.Message);
    emitEvent('message.edited', params.sessionId, { ...formatted });
    return formatted;
  } catch (err) {
    log.error(err, 'Failed to edit message');
    throw Errors.telegramError('Failed to edit message', (err as Error).message);
  }
}

export async function deleteMessages(params: DeleteMessageInput) {
  try {
    const client = await sessionManager.getClient(params.sessionId);
    await client.deleteMessages(params.chatId, params.messageIds, { revoke: true });

    log.info(
      { sessionId: params.sessionId, messageIds: params.messageIds },
      'Messages deleted',
    );
    emitEvent('message.deleted', params.sessionId, { deletedIds: params.messageIds });
    return { deletedIds: params.messageIds };
  } catch (err) {
    log.error(err, 'Failed to delete messages');
    throw Errors.telegramError('Failed to delete messages', (err as Error).message);
  }
}

export async function forwardMessages(params: ForwardMessageInput) {
  try {
    const client = await sessionManager.getClient(params.sessionId);
    const result = await client.forwardMessages(params.toChatId, {
      messages: params.messageIds,
      fromPeer: params.fromChatId,
    });

    log.info(
      { sessionId: params.sessionId, from: params.fromChatId, to: params.toChatId },
      'Messages forwarded',
    );
    return (result as Api.Message[]).map(formatMessage);
  } catch (err) {
    log.error(err, 'Failed to forward messages');
    throw Errors.telegramError('Failed to forward messages', (err as Error).message);
  }
}

export async function getHistory(params: GetHistoryInput) {
  try {
    const client = await sessionManager.getClient(params.sessionId);
    const messages = await client.getMessages(params.chatId, {
      limit: params.limit,
      offsetId: params.offsetId,
    });

    log.debug(
      { sessionId: params.sessionId, chatId: params.chatId, count: messages.length },
      'History fetched',
    );
    return messages.map((msg) => formatMessage(msg as Api.Message));
  } catch (err) {
    log.error(err, 'Failed to get message history');
    throw Errors.telegramError('Failed to get message history', (err as Error).message);
  }
}

export async function pinMessage(params: PinMessageInput) {
  try {
    const client = await sessionManager.getClient(params.sessionId);
    await client.pinMessage(params.chatId, params.messageId);

    log.info({ sessionId: params.sessionId, messageId: params.messageId }, 'Message pinned');
    return { pinned: true, messageId: params.messageId };
  } catch (err) {
    log.error(err, 'Failed to pin message');
    throw Errors.telegramError('Failed to pin message', (err as Error).message);
  }
}

export async function unpinMessage(params: PinMessageInput) {
  try {
    const client = await sessionManager.getClient(params.sessionId);
    await client.unpinMessage(params.chatId, params.messageId);

    log.info({ sessionId: params.sessionId, messageId: params.messageId }, 'Message unpinned');
    return { unpinned: true, messageId: params.messageId };
  } catch (err) {
    log.error(err, 'Failed to unpin message');
    throw Errors.telegramError('Failed to unpin message', (err as Error).message);
  }
}

export async function reactToMessage(params: ReactMessageInput) {
  try {
    const client = await sessionManager.getClient(params.sessionId);
    await client.invoke(
      new Api.messages.SendReaction({
        peer: params.chatId,
        msgId: params.messageId,
        reaction: [new Api.ReactionEmoji({ emoticon: params.emoji })],
      }),
    );

    log.info(
      { sessionId: params.sessionId, messageId: params.messageId, emoji: params.emoji },
      'Reaction sent',
    );
    return { reacted: true, messageId: params.messageId, emoji: params.emoji };
  } catch (err) {
    log.error(err, 'Failed to react to message');
    throw Errors.telegramError('Failed to react to message', (err as Error).message);
  }
}

export async function markAsRead(params: ReadMessagesInput) {
  try {
    const client = await sessionManager.getClient(params.sessionId);
    await client.markAsRead(params.chatId);

    log.info({ sessionId: params.sessionId, chatId: params.chatId }, 'Messages marked as read');
    emitEvent('message.read', params.sessionId, { chatId: params.chatId });
    return { read: true, chatId: params.chatId };
  } catch (err) {
    log.error(err, 'Failed to mark messages as read');
    throw Errors.telegramError('Failed to mark messages as read', (err as Error).message);
  }
}

import { Api } from 'telegram/tl/index.js';
import { sessionManager } from '../telegram/session-manager.js';
import { Errors } from '../utils/errors.js';
import { createChildLogger } from '../utils/logger.js';
import type { TelegramChat } from '../types/index.js';

const log = createChildLogger({ module: 'chat-service' });

// ─── Helpers ─────────────────────────────────────────────────────

function formatChat(entity: Api.TypeChat | Api.TypeUser | Api.Dialog): TelegramChat {
  // Handle Dialog objects
  if ('peer' in entity && 'title' in entity) {
    const dialog = entity as Api.Dialog & { title?: string; entity?: Api.TypeChat | Api.TypeUser };
    return {
      id: String(dialog.peer),
      title: ((dialog as unknown) as Record<string, unknown>).title as string ?? 'Unknown',
      type: 'user',
    };
  }

  // Handle User entities
  if ('firstName' in entity) {
    const user = entity as Api.User;
    return {
      id: String(user.id),
      title: [user.firstName, user.lastName].filter(Boolean).join(' '),
      type: 'user',
      username: user.username ?? undefined,
    };
  }

  // Handle Chat entities
  if ('title' in entity) {
    const chat = entity as Api.Chat | Api.Channel;
    let type: TelegramChat['type'] = 'group';

    if ('broadcast' in chat && (chat as Api.Channel).broadcast) {
      type = 'channel';
    } else if ('megagroup' in chat && (chat as Api.Channel).megagroup) {
      type = 'supergroup';
    }

    return {
      id: String(chat.id),
      title: chat.title,
      type,
      username: 'username' in chat ? (chat as Api.Channel).username ?? undefined : undefined,
      membersCount: 'participantsCount' in chat
        ? (chat as Api.Channel).participantsCount ?? undefined
        : undefined,
    };
  }

  return {
    id: String(((entity as unknown) as Record<string, unknown>).id ?? ''),
    title: 'Unknown',
    type: 'user',
  };
}

// ─── Service Methods ─────────────────────────────────────────────

export async function getChats(sessionId: string): Promise<TelegramChat[]> {
  try {
    const client = await sessionManager.getClient(sessionId);
    const dialogs = await client.getDialogs({ limit: 100 });

    log.debug({ sessionId, count: dialogs.length }, 'Chats fetched');
    return dialogs.map((dialog) => {
      if (dialog.entity) {
        return formatChat(dialog.entity);
      }
      return {
        id: String(dialog.id),
        title: dialog.title ?? 'Unknown',
        type: 'user' as const,
      };
    });
  } catch (err) {
    log.error(err, 'Failed to get chats');
    throw Errors.telegramError('Failed to get chats', (err as Error).message);
  }
}

export async function getChat(sessionId: string, chatId: string): Promise<TelegramChat> {
  try {
    const client = await sessionManager.getClient(sessionId);
    const entity = await client.getEntity(chatId);

    log.debug({ sessionId, chatId }, 'Chat fetched');
    return formatChat(entity as Api.TypeChat | Api.TypeUser);
  } catch (err) {
    log.error(err, 'Failed to get chat');
    throw Errors.telegramError('Failed to get chat', (err as Error).message);
  }
}

export async function joinChat(sessionId: string, chatId: string) {
  try {
    const client = await sessionManager.getClient(sessionId);
    await client.invoke(
      new Api.channels.JoinChannel({ channel: chatId }),
    );

    log.info({ sessionId, chatId }, 'Joined chat');
    return { joined: true, chatId };
  } catch (err) {
    log.error(err, 'Failed to join chat');
    throw Errors.telegramError('Failed to join chat', (err as Error).message);
  }
}

export async function leaveChat(sessionId: string, chatId: string) {
  try {
    const client = await sessionManager.getClient(sessionId);
    await client.invoke(
      new Api.channels.LeaveChannel({ channel: chatId }),
    );

    log.info({ sessionId, chatId }, 'Left chat');
    return { left: true, chatId };
  } catch (err) {
    log.error(err, 'Failed to leave chat');
    throw Errors.telegramError('Failed to leave chat', (err as Error).message);
  }
}

export async function getMembers(
  sessionId: string,
  chatId: string,
  limit: number,
  offset: number,
) {
  try {
    const client = await sessionManager.getClient(sessionId);
    const participants = await client.getParticipants(chatId, { limit, offset });

    log.debug({ sessionId, chatId, count: participants.length }, 'Members fetched');
    return participants.map((p) => ({
      id: String(p.id),
      firstName: (p as Api.User).firstName ?? '',
      lastName: (p as Api.User).lastName ?? undefined,
      username: (p as Api.User).username ?? undefined,
    }));
  } catch (err) {
    log.error(err, 'Failed to get members');
    throw Errors.telegramError('Failed to get members', (err as Error).message);
  }
}

export async function searchMessages(
  sessionId: string,
  chatId: string,
  query: string,
  limit: number,
) {
  try {
    const client = await sessionManager.getClient(sessionId);
    const result = await client.invoke(
      new Api.messages.Search({
        peer: chatId,
        q: query,
        limit,
        filter: new Api.InputMessagesFilterEmpty(),
      }),
    );

    const messages = 'messages' in result ? (result as Api.messages.Messages).messages : [];

    log.debug(
      { sessionId, chatId, query, count: messages.length },
      'Messages searched',
    );
    return messages.map((msg) => ({
      id: (msg as Api.Message).id,
      text: (msg as Api.Message).message ?? '',
      date: (msg as Api.Message).date ?? 0,
      senderId: (msg as Api.Message).fromId ? String((msg as Api.Message).fromId) : '',
    }));
  } catch (err) {
    log.error(err, 'Failed to search messages');
    throw Errors.telegramError('Failed to search messages', (err as Error).message);
  }
}

import type { TelegramClient } from 'telegram';
import { NewMessage } from 'telegram/events/index.js';
import { Raw } from 'telegram/events/index.js';
import { EditedMessage } from 'telegram/events/EditedMessage.js';
import { DeletedMessage } from 'telegram/events/DeletedMessage.js';
import type { NewMessageEvent } from 'telegram/events/NewMessage.js';
import type { EditedMessageEvent } from 'telegram/events/EditedMessage.js';
import type { DeletedMessageEvent } from 'telegram/events/DeletedMessage.js';
import { Api } from 'telegram/tl/index.js';
import { createChildLogger } from '../utils/logger.js';
import type { TeleFlowEvent } from '../types/index.js';

const log = createChildLogger({ module: 'event-handler' });

/**
 * Registers event handlers on a connected GramJS client.
 *
 * Maps GramJS events (NewMessage, EditedMessage, DeletedMessage, and raw
 * Api.Update* objects) to TeleFlow events and forwards them via `onEvent`.
 *
 * @param sessionId - The TeleFlow session ID owning this client.
 * @param client    - A connected TelegramClient instance.
 * @param onEvent   - Callback invoked for each emitted TeleFlowEvent.
 */
export function registerEventHandlers(
  sessionId: string,
  client: TelegramClient,
  onEvent: (event: TeleFlowEvent) => void,
): void {
  // ─── New (incoming) Message ──────────────────────────────────────
  client.addEventHandler(
    (event: NewMessageEvent) => {
      const message = event.message;
      onEvent({
        id: cryptoRandomId(),
        type: 'message.received',
        sessionId,
        timestamp: new Date().toISOString(),
        data: {
          messageId: message.id,
          chatId: message.chatId?.toString() ?? '',
          senderId: message.senderId?.toString() ?? '',
          text: message.text ?? '',
          date: message.date,
          isOutgoing: message.out ?? false,
          replyToMsgId: message.replyTo?.replyToMsgId,
        },
      });
    },
    new NewMessage({}),
  );

  // ─── Edited Message (incoming — covers message.edited for remote edits) ─
  client.addEventHandler(
    (event: EditedMessageEvent) => {
      const message = event.message as Api.Message;
      onEvent({
        id: cryptoRandomId(),
        type: 'message.edited',
        sessionId,
        timestamp: new Date().toISOString(),
        data: {
          messageId: message.id,
          chatId: message.chatId?.toString() ?? '',
          senderId: message.senderId?.toString() ?? '',
          text: message.message ?? '',
          date: message.date,
          editDate: message.editDate ?? undefined,
        },
      });
    },
    new EditedMessage({}),
  );

  // ─── Deleted Message (incoming — covers message.deleted for remote deletes) ─
  client.addEventHandler(
    (event: DeletedMessageEvent) => {
      onEvent({
        id: cryptoRandomId(),
        type: 'message.deleted',
        sessionId,
        timestamp: new Date().toISOString(),
        data: {
          deletedIds: event.deletedIds.map(String),
          chatId: event.chatId?.toString() ?? null,
        },
      });
    },
    new DeletedMessage({}),
  );

  // ─── Raw Update handlers (chat / group / channel / user lifecycle) ──────
  // One handler per Update type keeps the switch logic flat and readable.

  // Chat member joined (small groups)
  client.addEventHandler(
    (update: Api.UpdateChatParticipantAdd) => {
      onEvent({
        id: cryptoRandomId(),
        type: 'chat.member_joined',
        sessionId,
        timestamp: new Date().toISOString(),
        data: {
          chatId: String(update.chatId),
          userId: String(update.userId),
          inviterId: String(update.inviterId),
          version: update.version,
        },
      });
      onEvent({
        id: cryptoRandomId(),
        type: 'group.member_added',
        sessionId,
        timestamp: new Date().toISOString(),
        data: { chatId: String(update.chatId), userId: String(update.userId) },
      });
    },
    new Raw({ types: [Api.UpdateChatParticipantAdd] }),
  );

  // Chat member left (small groups)
  client.addEventHandler(
    (update: Api.UpdateChatParticipantDelete) => {
      onEvent({
        id: cryptoRandomId(),
        type: 'chat.member_left',
        sessionId,
        timestamp: new Date().toISOString(),
        data: { chatId: String(update.chatId), userId: String(update.userId), version: update.version },
      });
      onEvent({
        id: cryptoRandomId(),
        type: 'group.member_removed',
        sessionId,
        timestamp: new Date().toISOString(),
        data: { chatId: String(update.chatId), userId: String(update.userId) },
      });
    },
    new Raw({ types: [Api.UpdateChatParticipantDelete] }),
  );

  // Admin rights changed (small groups + channels)
  client.addEventHandler(
    (update: Api.UpdateChatParticipantAdmin) => {
      onEvent({
        id: cryptoRandomId(),
        type: 'group.admin_changed',
        sessionId,
        timestamp: new Date().toISOString(),
        data: { chatId: String(update.chatId), userId: String(update.userId), isAdmin: update.isAdmin },
      });
    },
    new Raw({ types: [Api.UpdateChatParticipantAdmin] }),
  );

  // Channel/supergroup participant change (join/leave/admin in channels)
  client.addEventHandler(
    (update: Api.UpdateChannelParticipant) => {
      const channelId = String(update.channelId);
      const userId = String(update.userId);
      const actorId = String(update.actorId);
      // Map the "action" to a semantic event
      const action = update.newParticipant;
      if (action instanceof Api.ChannelParticipant) {
        onEvent({
          id: cryptoRandomId(),
          type: 'group.member_added',
          sessionId,
          timestamp: new Date().toISOString(),
          data: { chatId: channelId, userId, actorId },
        });
        onEvent({
          id: cryptoRandomId(),
          type: 'chat.member_joined',
          sessionId,
          timestamp: new Date().toISOString(),
          data: { chatId: channelId, userId },
        });
      } else if (action instanceof Api.ChannelParticipantLeft) {
        onEvent({
          id: cryptoRandomId(),
          type: 'group.member_removed',
          sessionId,
          timestamp: new Date().toISOString(),
          data: { chatId: channelId, userId, actorId },
        });
        onEvent({
          id: cryptoRandomId(),
          type: 'chat.member_left',
          sessionId,
          timestamp: new Date().toISOString(),
          data: { chatId: channelId, userId },
        });
      } else if (action instanceof Api.ChannelParticipantAdmin || action instanceof Api.ChannelParticipantCreator) {
        onEvent({
          id: cryptoRandomId(),
          type: 'group.admin_changed',
          sessionId,
          timestamp: new Date().toISOString(),
          data: { chatId: channelId, userId, isAdmin: true },
        });
      }
    },
    new Raw({ types: [Api.UpdateChannelParticipant] }),
  );

  // New channel message = channel post published
  client.addEventHandler(
    (update: Api.UpdateNewChannelMessage) => {
      const message = update.message;
      if (message instanceof Api.Message) {
        onEvent({
          id: cryptoRandomId(),
          type: 'channel.post_published',
          sessionId,
          timestamp: new Date().toISOString(),
          data: {
            messageId: message.id,
            chatId: message.chatId?.toString() ?? '',
            senderId: message.senderId?.toString() ?? '',
            text: message.message ?? '',
            date: message.date,
          },
        });
      }
    },
    new Raw({ types: [Api.UpdateNewChannelMessage] }),
  );

  // User status changed (online/offline)
  client.addEventHandler(
    (update: Api.UpdateUserStatus) => {
      const status = update.status;
      let statusText = 'offline';
      if (status instanceof Api.UserStatusOnline) statusText = 'online';
      else if (status instanceof Api.UserStatusOffline) statusText = 'offline';
      else if (status instanceof Api.UserStatusRecently) statusText = 'recently';
      onEvent({
        id: cryptoRandomId(),
        type: 'user.status_changed',
        sessionId,
        timestamp: new Date().toISOString(),
        data: { userId: String(update.userId), status: statusText },
      });
    },
    new Raw({ types: [Api.UpdateUserStatus] }),
  );

  // User typing (private chat)
  client.addEventHandler(
    (update: Api.UpdateUserTyping) => {
      onEvent({
        id: cryptoRandomId(),
        type: 'user.typing',
        sessionId,
        timestamp: new Date().toISOString(),
        data: { userId: String(update.userId) },
      });
    },
    new Raw({ types: [Api.UpdateUserTyping] }),
  );

  // Chat typing (group/supergroup)
  client.addEventHandler(
    (update: Api.UpdateChatUserTyping) => {
      const fromId = update.fromId as { userId?: BigInt } | null;
      onEvent({
        id: cryptoRandomId(),
        type: 'user.typing',
        sessionId,
        timestamp: new Date().toISOString(),
        data: { userId: fromId?.userId ? String(fromId.userId) : '', chatId: String(update.chatId) },
      });
    },
    new Raw({ types: [Api.UpdateChatUserTyping] }),
  );

  // User profile/name updated
  client.addEventHandler(
    (update: Api.UpdateUserName) => {
      // usernames is an array of Api.TypeUsername; take the first editable one
      const usernameObj = update.usernames.find((u) => u instanceof Api.Username) as Api.Username | undefined;
      onEvent({
        id: cryptoRandomId(),
        type: 'user.profile_updated',
        sessionId,
        timestamp: new Date().toISOString(),
        data: {
          userId: String(update.userId),
          firstName: update.firstName ?? '',
          lastName: update.lastName ?? '',
          username: usernameObj?.username ?? '',
        },
      });
    },
    new Raw({ types: [Api.UpdateUserName] }),
  );

  log.info({ sessionId }, 'Event handlers registered (message + chat + group + channel + user)');
}

/** Generate a short unique event ID (nanoid-style, 21 chars). */
function cryptoRandomId(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const bytes = new Uint8Array(21);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < 21; i++) out += alphabet[bytes[i] % 64];
  return out;
}

import type { TelegramClient } from 'telegram';
import { NewMessage } from 'telegram/events/index.js';
import type { NewMessageEvent } from 'telegram/events/index.js';
import { nanoid } from 'nanoid';
import { createChildLogger } from '../utils/logger.js';
import type { TeleFlowEvent } from '../types/index.js';

const log = createChildLogger({ module: 'event-handler' });

/**
 * Registers event handlers on a connected GramJS client.
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
  // ─── New Message Handler ─────────────────────────────────────────
  client.addEventHandler(
    (event: NewMessageEvent) => {
      const message = event.message;

      const teleflowEvent: TeleFlowEvent = {
        id: nanoid(),
        type: 'message.created',
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
      };

      log.debug({ sessionId, type: teleflowEvent.type, messageId: message.id }, 'Event emitted');
      onEvent(teleflowEvent);
    },
    new NewMessage({}),
  );

  log.info({ sessionId }, 'Event handlers registered');
}

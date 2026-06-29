import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { config } from '../config/index.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger({ module: 'telegram-client' });

/**
 * Creates a new GramJS TelegramClient instance.
 *
 * @param sessionString - Optional saved session string to restore a session.
 *                        Defaults to empty string (new session).
 * @returns A configured TelegramClient (not yet connected).
 */
export function createTelegramClient(sessionString = ''): TelegramClient {
  const session = new StringSession(sessionString);
  const client = new TelegramClient(session, config.TELEGRAM_API_ID, config.TELEGRAM_API_HASH, {
    connectionRetries: 3,
  });

  log.debug('Telegram client created');
  return client;
}

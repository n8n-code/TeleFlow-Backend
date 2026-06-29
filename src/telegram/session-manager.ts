import type { TelegramClient } from 'telegram';
import { createChildLogger } from '../utils/logger.js';
import { Errors } from '../utils/errors.js';
import { registerEventHandlers } from './event-handler.js';
import { emitEvent } from '../events/emit.js';

const log = createChildLogger({ module: 'session-manager' });

class SessionManager {
  private clients: Map<string, TelegramClient> = new Map();

  /**
   * Retrieves a connected client by session ID.
   * @throws AppError if the session is not connected.
   */
  getClient(sessionId: string): TelegramClient {
    const client = this.clients.get(sessionId);
    if (!client) {
      throw Errors.sessionNotConnected(sessionId);
    }
    return client;
  }

  /** Stores a client instance for a given session ID and wires event handlers. */
  addClient(sessionId: string, client: TelegramClient): void {
    this.clients.set(sessionId, client);
    log.info({ sessionId }, 'Client added to session manager');

    // Wire GramJS events → TeleFlow event pipeline → webhooks
    registerEventHandlers(sessionId, client, (event) => {
      emitEvent(event.type, sessionId, event.data);
    });
  }

  /** Disconnects and removes a client from the manager. */
  async removeClient(sessionId: string): Promise<void> {
    const client = this.clients.get(sessionId);
    if (client) {
      try {
        await client.disconnect();
        log.info({ sessionId }, 'Client disconnected');
      } catch (err) {
        log.warn({ sessionId, err }, 'Error disconnecting client');
      }
      this.clients.delete(sessionId);
    }
  }

  /** Returns all currently managed session IDs. */
  getAllSessions(): string[] {
    return Array.from(this.clients.keys());
  }

  /** Checks whether a session is currently connected. */
  isConnected(sessionId: string): boolean {
    return this.clients.has(sessionId);
  }

  /** Disconnects and removes all managed clients. */
  async disconnectAll(): Promise<void> {
    const sessionIds = this.getAllSessions();
    log.info({ count: sessionIds.length }, 'Disconnecting all sessions');

    await Promise.allSettled(
      sessionIds.map((id) => this.removeClient(id)),
    );

    log.info('All sessions disconnected');
  }
}

export const sessionManager = new SessionManager();

import { EventEmitter } from 'node:events';
import type { TeleFlowEvent } from '../types/index.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger({ module: 'event-dispatcher' });

const MAX_BUFFER_SIZE = 1000;

export class EventDispatcher extends EventEmitter {
  private buffer: TeleFlowEvent[] = [];
  private head = 0;
  private count = 0;

  constructor() {
    super();
    this.setMaxListeners(100);
    this.buffer = new Array<TeleFlowEvent>(MAX_BUFFER_SIZE);
  }

  /**
   * Dispatch an event: store in ring buffer and emit to listeners.
   * Emits both the specific event type and a wildcard '*' event.
   */
  dispatch(event: TeleFlowEvent): void {
    // Ring buffer insert
    const index = (this.head + this.count) % MAX_BUFFER_SIZE;
    this.buffer[index] = event;

    if (this.count < MAX_BUFFER_SIZE) {
      this.count++;
    } else {
      // Buffer is full — advance head (oldest entry overwritten)
      this.head = (this.head + 1) % MAX_BUFFER_SIZE;
    }

    log.debug({ eventType: event.type, eventId: event.id }, 'Event dispatched');

    this.emit(event.type, event);
    this.emit('*', event);
  }

  /**
   * Retrieve the most recent events from the ring buffer.
   */
  getRecentEvents(limit = 50): TeleFlowEvent[] {
    const effectiveLimit = Math.min(limit, this.count);
    const result: TeleFlowEvent[] = [];

    for (let i = 0; i < effectiveLimit; i++) {
      const index = (this.head + this.count - effectiveLimit + i) % MAX_BUFFER_SIZE;
      result.push(this.buffer[index]);
    }

    return result;
  }

  /**
   * Get the total number of events currently in the buffer.
   */
  getBufferSize(): number {
    return this.count;
  }
}

export const eventDispatcher = new EventDispatcher();

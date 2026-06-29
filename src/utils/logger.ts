import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  transport:
    config.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' } }
      : undefined,
  base: { service: 'teleflow' },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: pino.stdSerializers,
});

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

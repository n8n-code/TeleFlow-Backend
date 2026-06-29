import { buildServer } from './server.js';
import { connectDatabase, disconnectDatabase } from './database/prisma.js';
import { prisma } from './database/prisma.js';
import { sessionManager } from './telegram/session-manager.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { connectSession } from './services/session.service.js';

// ─── Main ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Connect to database
  await connectDatabase();

  // Build Fastify server
  const server = await buildServer();

  // Reconnect previously active & authorized sessions
  try {
    const activeSessions = await prisma.session.findMany({
      where: { isActive: true, isAuthorized: true },
    });

    if (activeSessions.length > 0) {
      logger.info(
        { count: activeSessions.length },
        'Reconnecting previously active sessions',
      );

      for (const session of activeSessions) {
        try {
          await connectSession(session.id);
          logger.info({ sessionId: session.id, name: session.name }, 'Session reconnected');
        } catch (err) {
          logger.error(
            { sessionId: session.id, err },
            'Failed to reconnect session',
          );
        }
      }
    }
  } catch (err) {
    logger.error(err, 'Failed to query active sessions for reconnection');
  }

  // Start listening
  try {
    const address = await server.listen({ port: config.PORT, host: config.HOST });
    logger.info(
      {
        address,
        environment: config.NODE_ENV,
        docs: `http://${config.HOST === '0.0.0.0' ? 'localhost' : config.HOST}:${config.PORT}/docs`,
      },
      '🚀 TeleFlow server started',
    );
  } catch (err) {
    logger.fatal(err, 'Failed to start server');
    process.exit(1);
  }

  // ─── Graceful Shutdown ───────────────────────────────────────

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down gracefully...');

    try {
      // Disconnect all Telegram sessions
      await sessionManager.disconnectAll();
      logger.info('All Telegram sessions disconnected');
    } catch (err) {
      logger.error(err, 'Error disconnecting sessions');
    }

    try {
      // Disconnect database
      await disconnectDatabase();
    } catch (err) {
      logger.error(err, 'Error disconnecting database');
    }

    try {
      // Close Fastify server
      await server.close();
      logger.info('Server closed');
    } catch (err) {
      logger.error(err, 'Error closing server');
    }

    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// ─── Run ─────────────────────────────────────────────────────────

main().catch((err) => {
  logger.fatal(err, 'Unhandled error during startup');
  process.exit(1);
});

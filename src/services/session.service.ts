import { Api } from 'telegram/tl/index.js';
import { RPCError } from 'telegram/errors/index.js';
import { prisma } from '../database/prisma.js';
import { sessionManager } from '../telegram/session-manager.js';
import { createTelegramClient } from '../telegram/client.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { config } from '../config/index.js';
import { createChildLogger } from '../utils/logger.js';
import { Errors } from '../utils/errors.js';
import { emitEvent } from '../events/emit.js';
import type { SessionLoginState } from '../types/index.js';

const log = createChildLogger({ module: 'session-service' });

// ─── Create Session (Start Login Flow) ───────────────────────────

export async function createSession(
  name: string,
  phoneNumber: string,
  userId: string,
): Promise<SessionLoginState> {
  const session = await prisma.session.create({
    data: { name, phoneNumber, userId },
  });

  const client = createTelegramClient();
  await client.connect();

  try {
    const result = await client.sendCode(
      { apiId: config.TELEGRAM_API_ID, apiHash: config.TELEGRAM_API_HASH },
      phoneNumber,
    );

    sessionManager.addClient(session.id, client);

    await prisma.session.update({
      where: { id: session.id },
      data: { isActive: true },
    });

    log.info({ sessionId: session.id }, 'Session created, code sent');

    emitEvent('session.created', session.id, { phoneNumber });

    return {
      sessionId: session.id,
      step: 'CODE_REQUIRED',
      phoneCodeHash: result.phoneCodeHash,
    };
  } catch (err) {
    // Cleanup on failure
    await client.disconnect().catch(() => {});
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});

    if (err instanceof RPCError) {
      throw Errors.telegramError(err.errorMessage, { code: err.code });
    }
    throw err;
  }
}

// ─── Verify Phone Code ───────────────────────────────────────────

export async function verifyCode(
  sessionId: string,
  phoneCode: string,
  phoneCodeHash: string,
  userId: string,
): Promise<SessionLoginState> {
  const dbSession = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!dbSession || dbSession.userId !== userId) throw Errors.sessionNotFound(sessionId);

  const client = sessionManager.getClient(sessionId);

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: dbSession.phoneNumber,
        phoneCodeHash,
        phoneCode,
      }),
    );

    // Login succeeded — save session
    const sessionString = client.session.save() as unknown as string;

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        sessionString: encrypt(sessionString),
        isAuthorized: true,
        lastConnected: new Date(),
      },
    });

    log.info({ sessionId }, 'Session verified and logged in');

    emitEvent('session.authorized', sessionId, { method: 'code' });

    return { sessionId, step: 'LOGGED_IN' };
  } catch (err) {
    if (err instanceof RPCError && err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
      log.info({ sessionId }, '2FA password required');
      return { sessionId, step: 'PASSWORD_REQUIRED' };
    }

    if (err instanceof RPCError) {
      throw Errors.telegramError(err.errorMessage, { code: err.code });
    }
    throw err;
  }
}

// ─── Verify 2FA Password ────────────────────────────────────────

export async function verifyPassword(
  sessionId: string,
  password: string,
  userId: string,
): Promise<SessionLoginState> {
  const dbSession = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!dbSession || dbSession.userId !== userId) throw Errors.sessionNotFound(sessionId);

  const client = sessionManager.getClient(sessionId);

  try {
    await client.signInWithPassword(
      { apiId: config.TELEGRAM_API_ID, apiHash: config.TELEGRAM_API_HASH },
      {
        password: async () => password,
        onError: (err: Error) => {
          log.error({ sessionId, err }, '2FA sign-in error');
          return Promise.resolve(true); // stop retrying
        },
      },
    );

    const sessionString = client.session.save() as unknown as string;

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        sessionString: encrypt(sessionString),
        isAuthorized: true,
        lastConnected: new Date(),
      },
    });

    log.info({ sessionId }, 'Session verified with 2FA password');

    emitEvent('session.authorized', sessionId, { method: 'password' });

    return { sessionId, step: 'LOGGED_IN' };
  } catch (err) {
    if (err instanceof RPCError) {
      throw Errors.telegramError(err.errorMessage, { code: err.code });
    }
    throw err;
  }
}

// ─── Import Session ──────────────────────────────────────────────

export async function importSession(
  name: string,
  sessionString: string,
  userId: string,
): Promise<{ sessionId: string }> {
  const client = createTelegramClient(sessionString);
  await client.connect();

  try {
    const me = await client.getMe();
    const phoneNumber = (me as Api.User).phone ?? '';

    const session = await prisma.session.create({
      data: {
        name,
        phoneNumber,
        sessionString: encrypt(sessionString),
        isActive: true,
        isAuthorized: true,
        lastConnected: new Date(),
        userId,
      },
    });

    sessionManager.addClient(session.id, client);

    log.info({ sessionId: session.id }, 'Session imported successfully');

    return { sessionId: session.id };
  } catch (err) {
    await client.disconnect().catch(() => {});

    if (err instanceof RPCError) {
      throw Errors.telegramError(err.errorMessage, { code: err.code });
    }
    throw err;
  }
}

// ─── Get All Sessions ────────────────────────────────────────────

export async function getSessions(userId: string) {
  const sessions = await prisma.session.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      isActive: true,
      isAuthorized: true,
      createdAt: true,
      lastConnected: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return sessions.map((s) => ({
    ...s,
    isActive: sessionManager.isConnected(s.id),
    createdAt: s.createdAt.toISOString(),
    lastConnected: s.lastConnected?.toISOString() ?? null,
  }));
}

// ─── Get Single Session ──────────────────────────────────────────

export async function getSession(id: string, userId: string) {
  const session = await prisma.session.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      isActive: true,
      isAuthorized: true,
      createdAt: true,
      lastConnected: true,
      userId: true,
    },
  });

  if (!session || session.userId !== userId) throw Errors.sessionNotFound(id);

  return {
    ...session,
    isActive: sessionManager.isConnected(session.id),
    createdAt: session.createdAt.toISOString(),
    lastConnected: session.lastConnected?.toISOString() ?? null,
  };
}

// ─── Delete Session ──────────────────────────────────────────────

export async function deleteSession(id: string, userId: string): Promise<void> {
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session || session.userId !== userId) throw Errors.sessionNotFound(id);

  if (sessionManager.isConnected(id)) {
    await sessionManager.removeClient(id);
  }

  await prisma.session.delete({ where: { id } });
  log.info({ sessionId: id }, 'Session deleted');

  emitEvent('session.deleted', id, {});
}

// ─── Connect Session ─────────────────────────────────────────────

export async function connectSession(id: string, userId?: string): Promise<void> {
  if (sessionManager.isConnected(id)) {
    log.debug({ sessionId: id }, 'Session already connected');
    return;
  }

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session || (userId !== undefined && session.userId !== userId)) throw Errors.sessionNotFound(id);
  if (!session.sessionString) {
    throw Errors.badRequest('Session has no stored session string — login first');
  }

  const decryptedSession = decrypt(session.sessionString);
  const client = createTelegramClient(decryptedSession);
  await client.connect();

  sessionManager.addClient(id, client);

  await prisma.session.update({
    where: { id },
    data: { isActive: true, lastConnected: new Date() },
  });

  log.info({ sessionId: id }, 'Session connected');

  emitEvent('session.connected', id, {});
}

// ─── Disconnect Session ──────────────────────────────────────────

export async function disconnectSession(id: string, userId: string): Promise<void> {
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session || session.userId !== userId) throw Errors.sessionNotFound(id);

  if (!sessionManager.isConnected(id)) {
    throw Errors.sessionNotConnected(id);
  }

  await sessionManager.removeClient(id);

  await prisma.session.update({
    where: { id },
    data: { isActive: false },
  });

  log.info({ sessionId: id }, 'Session disconnected');

  emitEvent('session.disconnected', id, {});
}

// ─── Export Session ──────────────────────────────────────────────

export async function exportSession(id: string, userId: string): Promise<{ sessionString: string }> {
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session || session.userId !== userId) throw Errors.sessionNotFound(id);
  if (!session.sessionString) {
    throw Errors.badRequest('Session has no stored session string');
  }

  return { sessionString: decrypt(session.sessionString) };
}

import { prisma } from '../database/prisma.js';
import { generateApiKey } from '../utils/crypto.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger({ module: 'auth-service' });

// ─── JWT sign function type ──────────────────────────────────────

export type SignJwt = (payload: { sub: string; role: string }, options?: { expiresIn?: string }) => string;

// ─── Login ───────────────────────────────────────────────────────

export async function login(
  name: string,
  role: string,
  signJwt: SignJwt,
): Promise<{ apiKey: string; jwt: string; role: string }> {
  const key = generateApiKey();

  const apiKeyRecord = await prisma.apiKey.create({
    data: {
      name,
      key,
      role,
    },
  });

  const jwt = signJwt(
    { sub: apiKeyRecord.id, role: apiKeyRecord.role },
    { expiresIn: '7d' },
  );

  log.info({ name, role, apiKeyId: apiKeyRecord.id }, 'User logged in');

  return { apiKey: key, jwt, role: apiKeyRecord.role };
}

// ─── Get Me ──────────────────────────────────────────────────────

export async function getMe(apiKeyId: string) {
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return apiKey;
}

// ─── Logout ──────────────────────────────────────────────────────

export async function logout(apiKeyId: string): Promise<void> {
  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { isActive: false },
  });

  log.info({ apiKeyId }, 'User logged out (API key deactivated)');
}

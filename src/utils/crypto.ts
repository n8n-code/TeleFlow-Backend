import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { config } from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 16;

function deriveKey(salt: Buffer): Buffer {
  return scryptSync(config.SESSION_ENCRYPTION_KEY, salt, 32);
}

export function encrypt(plaintext: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // salt:iv:tag:encrypted (all base64)
  return [salt, iv, tag, encrypted].map((b) => b.toString('base64')).join(':');
}

export function decrypt(ciphertext: string): string {
  const [saltB64, ivB64, tagB64, encB64] = ciphertext.split(':');
  const salt = Buffer.from(saltB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(encB64, 'base64');

  const key = deriveKey(salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function generateApiKey(): string {
  return `tfb_${randomBytes(32).toString('hex')}`;
}

export function generateSecret(): string {
  return randomBytes(32).toString('hex');
}

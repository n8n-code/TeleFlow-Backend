import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Sign a payload string with an HMAC-SHA256 hex digest.
 */
export function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

/**
 * Verify a payload against a signature using timing-safe comparison.
 */
export function verify(payload: string, secret: string, signature: string): boolean {
  const expected = sign(payload, secret);

  // Both must be the same length for timingSafeEqual
  if (expected.length !== signature.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
}

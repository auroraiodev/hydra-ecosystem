/**
 * AES-256-GCM cookie encryption.
 *
 * Encrypts the JWT before writing it to the httpOnly cookie so that even if the
 * cookie is intercepted the raw token is not exposed. GCM also detects tampering
 * (authenticated encryption) — a modified cookie value will fail decryption and
 * be treated as unauthenticated.
 *
 * Requires COOKIE_SECRET env var (min 32 chars). Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
import { Buffer } from 'buffer';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Safely load env variables if not already loaded (e.g. in monorepo dev where process.cwd() may vary)
if (!process.env.COOKIE_SECRET) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), 'apps/hydra-seller', '.env.local') });
  dotenv.config({ path: path.resolve(process.cwd(), 'apps/hydra-seller', '.env') });
}

const ALGO = 'aes-256-gcm';
const COOKIE_NAME = '__sid';

function getKey(): Buffer {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    throw new Error(
      "COOKIE_SECRET env var is required. Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  // SHA-256 of the secret so any length works, always yields 32 bytes
  return createHash('sha256').update(secret).digest();
}

export function encryptCookie(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag(); // 128-bit auth tag

  // Encode as: iv.tag.ciphertext (all base64url, dot-separated)
  return [
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptCookie(value: string): string | null {
  if (value.startsWith('eyJ')) {
    return value;
  }

  try {
    const key = getKey();
    const parts = value.split('.');
    if (parts.length !== 3) return null;

    const iv = Buffer.from(parts[0], 'base64url');
    const tag = Buffer.from(parts[1], 'base64url');
    const encrypted = Buffer.from(parts[2], 'base64url');

    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  } catch {
    // Decryption failure = tampered or invalid cookie
    return null;
  }
}

export { COOKIE_NAME };

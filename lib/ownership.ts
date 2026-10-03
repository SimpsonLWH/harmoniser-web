/**
 * One anonymous token scheme for the whole product: the device/app ID.
 *
 * The native app generates a random >=32-byte token on first run and keeps it in Preferences;
 * the browser generates one per browser and keeps it in localStorage. The same token proves
 * publish/delete ownership and acts as the install/device ID. The server only ever stores
 * HMAC-SHA-256 hashes, keyed by APP_HMAC_SECRET.
 *
 * Tokens prove anonymous control of a record, not a verified human or device identity.
 * Losing the token means losing self-service delete; that is stated in the UI.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { requireEnv } from './env';

export const TOKEN_HEADER = 'x-harmoniser-token';
const TOKEN_RE = /^[A-Za-z0-9_-]{32,256}$/;

export function readToken(request: Request): string | null {
  const raw = request.headers.get(TOKEN_HEADER);
  if (raw === null) {
    return null;
  }
  const token = raw.trim();
  return TOKEN_RE.test(token) ? token : null;
}

function secret(): string {
  return requireEnv('APP_HMAC_SECRET');
}

function hmac(label: string, value: string): string {
  return createHmac('sha256', secret()).update(`${label}:${value}`, 'utf8').digest('hex');
}

/** Hash stored on the capsule document. */
export function hashToken(token: string): string {
  return hmac('owner', token);
}

/** Stable principal hash for install/report receipts (never stored raw). */
export function hashPrincipal(token: string): string {
  return hmac('principal', token);
}

/** Constant-time comparison between a presented token and a stored hash. */
export function tokenMatches(token: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashToken(token), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  if (candidate.length !== stored.length || stored.length === 0) {
    return false;
  }
  return timingSafeEqual(candidate, stored);
}

/** Used by scripts and tests; browsers generate their own token with Web Crypto. */
export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export function isValidTokenShape(token: string): boolean {
  return TOKEN_RE.test(token);
}

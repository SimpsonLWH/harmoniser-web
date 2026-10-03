/**
 * The two anonymous client identities and their keyed hashes.
 *
 * Both travel in X-Harmoniser-Token and both are random >=32-byte client-generated values; they
 * differ in what they prove:
 *
 * - ownerToken -> hashToken(): publishing and deletion ownership of a capsule
 *   (POST /api/capsules, DELETE /api/capsules/{id}).
 * - installId -> hashPrincipal(): install/report deduplication and relay user-side ownership
 *   (/pair, send-to-device). It never owns a capsule.
 *
 * The distinct HMAC labels ("owner" and "principal") keep the two hash spaces apart, so a value
 * cannot be replayed from one role into the other. The relay's server-issued device bearer token
 * is a third credential with its own label (lib/devices/tokens.ts).
 *
 * They prove anonymous control of a record, not a verified human or device identity. Losing the
 * ownerToken means losing self-service delete; that is stated in the UI.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { contentHash } from './canonical';
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

/**
 * The deduplication key of one install/report mutation: same capsule + operation + principal
 * hashes to the same key (so the second call is a no-op), any different principal or operation
 * to a different one.
 */
export function mutationKey(operation: string, capsuleId: string, principalHash: string): string {
  // The same canonical-JSON hash the install/report routes have always used, kept identical so
  // receipts written before this helper existed still deduplicate.
  return contentHash({ capsuleId, operation, principal: principalHash });
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

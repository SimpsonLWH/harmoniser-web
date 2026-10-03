/**
 * The device token: the credential of one board or one /device browser tab, issued by
 * POST /api/devices/register and sent back as "Authorization: Bearer <token>".
 *
 * It is not the anonymous user token (X-Harmoniser-Token, lib/ownership.ts): that one is made
 * by the client and says who a person's install is; this one is made by the server and says
 * which device is polling. Like the user token it is stored only as an HMAC-SHA-256 hash
 * keyed by APP_HMAC_SECRET, never returned again, never logged.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { requireEnv } from '@/lib/env';
import { newToken } from '@/lib/ownership';

const MAX_TOKEN_LENGTH = 512;
const BEARER = /^Bearer[ \t]+(\S+)[ \t]*$/i;

/** 43 characters of A-Z a-z 0-9 _ - (the board takes up to 128 of a wider set). */
export function newDeviceToken(): string {
  return newToken();
}

export function hashDeviceToken(token: string): string {
  return createHmac('sha256', requireEnv('APP_HMAC_SECRET')).update(`device:${token}`, 'utf8').digest('hex');
}

/** Constant-time comparison between a presented device token and a stored hash. */
export function deviceTokenMatches(token: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashDeviceToken(token), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  if (candidate.length !== stored.length || stored.length === 0) {
    return false;
  }
  return timingSafeEqual(candidate, stored);
}

/** The token of an "Authorization: Bearer <token>" header, or null. */
export function parseBearer(header: string | null | undefined): string | null {
  const match = BEARER.exec(header ?? '');
  const token = match?.[1];
  return token !== undefined && token.length <= MAX_TOKEN_LENGTH ? token : null;
}

export function newDeviceId(): string {
  return 'dev_' + randomBytes(8).toString('hex');
}

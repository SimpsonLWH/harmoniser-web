/**
 * Durable, serverless-safe rate limiting with MongoDB atomic upserts.
 * Key = HMAC(secret, route + trusted IP) per UTC window; TTL is cleanup, the count decides.
 */

import { createHmac } from 'node:crypto';

import { requireEnv } from './env';
import { RateBucket } from '@/models/RateBucket';

export const PUBLISH_LIMIT = 10;
export const PUBLISH_WINDOW_MS = 60 * 60 * 1000;
export const BUCKET_CLEANUP_MS = 24 * 60 * 60 * 1000;

export interface RateResult {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

export function bucketKey(route: string, ip: string, now: number): { key: string; windowStart: number } {
  const windowStart = Math.floor(now / PUBLISH_WINDOW_MS) * PUBLISH_WINDOW_MS;
  const key = createHmac('sha256', requireEnv('APP_HMAC_SECRET'))
    .update(`${route}|${ip}|${windowStart}`, 'utf8')
    .digest('hex');
  return { key, windowStart };
}

export async function consumePublishLimit(route: string, ip: string, now = Date.now()): Promise<RateResult> {
  const { key, windowStart } = bucketKey(route, ip, now);
  const doc = await RateBucket.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(windowStart + PUBLISH_WINDOW_MS + BUCKET_CLEANUP_MS) },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean<{ count: number } | null>();
  const count = doc?.count ?? 1;
  const resetAt = windowStart + PUBLISH_WINDOW_MS;
  return {
    allowed: count <= PUBLISH_LIMIT,
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    remaining: Math.max(0, PUBLISH_LIMIT - count),
  };
}

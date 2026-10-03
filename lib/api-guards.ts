/** Small shared guards for the capsule API routes. */

import type { NextResponse } from 'next/server';

import { clientIp } from './client-ip';
import { mutationOriginOk, mutationCorsHeaders } from './cors';
import { errorResponse } from './http';
import { readToken } from './ownership';

export type Guard<T> = { ok: true; value: T } | { ok: false; response: NextResponse };

/** Mutating browser requests must come from an allowed origin; native clients send no Origin. */
export function guardOrigin(request: Request): NextResponse | null {
  if (mutationOriginOk(request)) {
    return null;
  }
  return errorResponse(403, 'origin_not_allowed', 'This origin is not allowed to change the marketplace.', undefined, mutationCorsHeaders(request));
}

export function guardToken(request: Request): Guard<string> {
  const token = readToken(request);
  if (token === null) {
    return {
      ok: false,
      response: errorResponse(
        401,
        'unauthorized',
        'Send your device token in the X-Harmoniser-Token header.',
        undefined,
        mutationCorsHeaders(request),
      ),
    };
  }
  return { ok: true, value: token };
}

/** Writes fail closed when the platform did not give us a client address. */
export function guardIp(request: Request): Guard<string> {
  const ip = clientIp(request);
  if (ip === null) {
    return {
      ok: false,
      response: errorResponse(
        503,
        'rate_limit_unavailable',
        'Rate limiting is unavailable for this request; try again later.',
        undefined,
        mutationCorsHeaders(request),
      ),
    };
  }
  return { ok: true, value: ip };
}

export function notFound(request: Request): NextResponse {
  return errorResponse(404, 'not_found', 'No such capsule.', undefined, mutationCorsHeaders(request));
}

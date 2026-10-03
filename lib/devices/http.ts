/** HTTP glue for the relay routes: bounded bodies, the site's error envelope, CORS, pair_url base. */

import { NextResponse } from 'next/server';

import { mutationCorsHeaders, requestHost } from '@/lib/cors';
import { envValue } from '@/lib/env';
import { errorResponse, handleApiError, noStore, type ApiErrorBody } from '@/lib/http';

import { ERR_BAD_JSON, ERR_TOO_LARGE, RelayError } from './errors';
import { MAX_BODY_BYTES, parseJsonObject, type JsonObject } from './json';

/**
 * The body as one JSON object, under the board's own limits (1024 bytes, 8 levels, no NUL).
 * Unlike lib/http.ts readJsonBody this does not ask for a Content-Type: the firmware sets one,
 * but a missing header on a 200-byte JSON body is not worth failing a wrist device over, and
 * the routes are protected by tokens in custom headers, not by the content type.
 */
export async function readRelayBody(request: Request): Promise<JsonObject> {
  const declared = request.headers.get('content-length');
  if (declared !== null && /^\d{1,15}$/.test(declared.trim()) && Number(declared) > MAX_BODY_BYTES) {
    throw new RelayError(ERR_TOO_LARGE);
  }
  if (request.body === null) {
    throw new RelayError(ERR_BAD_JSON);
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RelayError(ERR_TOO_LARGE);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return parseJsonObject(bytes);
}

/** lib/cors.ts headers, plus PUT (the capsule route is the site's only PUT). */
export function userCorsHeaders(request: Request): Record<string, string> {
  const headers = mutationCorsHeaders(request);
  if (headers['Access-Control-Allow-Methods'] === undefined) {
    return headers;
  }
  return { ...headers, 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS' };
}

export function json(status: number, payload: unknown, headers?: Record<string, string>): NextResponse {
  return NextResponse.json(payload, { status, headers: noStore(headers) });
}

export function noContent(headers?: Record<string, string>): NextResponse {
  return new NextResponse(null, { status: 204, headers: noStore(headers) });
}

// Anything that looks like a pairing code or a token is taken out before a message is logged.
const CODE_LIKE = /\b[a-z]{3,5}(?:[- ][a-z]{3,5}){2}\b/gi;
const TOKEN_LIKE = /[A-Za-z0-9._~+/=-]{24,}/g;

export function redact(text: string): string {
  return text.replace(TOKEN_LIKE, '<redacted>').replace(CODE_LIKE, '<code>');
}

/** A refusal in the site's envelope; anything unexpected is logged (redacted) and becomes a 503. */
export function failure(
  route: string,
  error: unknown,
  headers?: Record<string, string>,
): NextResponse<ApiErrorBody> {
  if (error instanceof RelayError) {
    const extra: Record<string, string> = {};
    if (error.retryAfterSeconds !== undefined) {
      extra['Retry-After'] = String(error.retryAfterSeconds);
    }
    return errorResponse(error.status, error.code, error.message, undefined, noStore({ ...headers, ...extra }));
  }
  const name = error instanceof Error ? error.name : typeof error;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`device relay: ${route} failed: ${name}: ${redact(message)}`);
  return handleApiError(error);
}

const HOST_PATTERN = /^[a-z0-9.\-[\]:]{1,100}$/;

/**
 * Where /pair lives, for pair_url. NEXT_PUBLIC_SITE_URL when it is set (the deployed site, or
 * a custom domain); otherwise the host the request came in on, which is what a board talking
 * to a laptop on the same network needs.
 */
export function pairBaseUrl(request: Request): string {
  const configured = envValue('NEXT_PUBLIC_SITE_URL');
  if (configured !== undefined) {
    return configured.replace(/\/+$/, '');
  }
  const url = new URL(request.url);
  const host = requestHost(request);
  const proto = request.headers.get('x-forwarded-proto') === 'https' ? 'https' : url.protocol.replace(':', '');
  // A Host header that is not a plain host[:port] is not echoed into a URL.
  return `${proto}://${host !== null && HOST_PATTERN.test(host) ? host : url.host}`;
}

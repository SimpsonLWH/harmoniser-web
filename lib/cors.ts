/** CORS + mutation-origin policy. Browser Origin is not authentication: tokens still decide. */

import { allowedOrigins } from './env';

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

export function requestHost(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-host');
  const host = forwarded ?? request.headers.get('host');
  return host === null ? null : host.toLowerCase();
}

export function originAllowed(origin: string, request: Request): boolean {
  const normalized = origin.replace(/\/+$/, '').toLowerCase();
  if (allowedOrigins().includes(normalized)) {
    return true;
  }
  const host = hostOf(normalized);
  return host !== null && host === requestHost(request);
}

/** Read-only responses are open to any origin. */
export function readCorsHeaders(): Record<string, string> {
  return { 'Access-Control-Allow-Origin': '*', Vary: 'Origin' };
}

/** Mutating responses echo an allowed origin only; native clients (no Origin) pass through. */
export function mutationCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  if (origin === null) {
    return { Vary: 'Origin' };
  }
  if (!originAllowed(origin, request)) {
    return { Vary: 'Origin' };
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-harmoniser-token',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

export function mutationOriginOk(request: Request): boolean {
  const origin = request.headers.get('origin');
  return origin === null || originAllowed(origin, request);
}

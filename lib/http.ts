/** Shared HTTP helpers: error shape, bounded JSON reads, DB-error mapping. */

import { NextResponse } from 'next/server';

import { MissingEnvError } from './env';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
  headers?: Record<string, string>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message, ...(details === undefined ? {} : { details }) } }, {
    status,
    headers,
  });
}

export function noStore(headers?: Record<string, string>): Record<string, string> {
  return { 'Cache-Control': 'no-store', ...(headers ?? {}) };
}

export type BodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: number; code: string; message: string };

/** Streams the body with a hard byte cap, then parses JSON. Never buffers past the cap. */
export async function readJsonBody(request: Request, maxBytes: number): Promise<BodyResult> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return { ok: false, status: 415, code: 'unsupported_media_type', message: 'Send application/json.' };
  }
  const body = request.body;
  if (body === null) {
    return { ok: false, status: 400, code: 'invalid_json', message: 'The request body is empty.' };
  }
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value !== undefined) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          return {
            ok: false,
            status: 413,
            code: 'payload_too_large',
            message: `The request body is larger than ${maxBytes} bytes.`,
          };
        }
        chunks.push(value);
      }
    }
  } catch {
    return { ok: false, status: 400, code: 'invalid_json', message: 'The request body could not be read.' };
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, status: 400, code: 'invalid_json', message: 'The request body is not valid UTF-8.' };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 400, code: 'invalid_json', message: 'The request body is not valid JSON.' };
  }
}

/** Maps unexpected server errors to the shared error shape; never leaks stack traces. */
export function handleApiError(e: unknown): NextResponse<ApiErrorBody> {
  if (e instanceof MissingEnvError) {
    return errorResponse(503, 'unavailable', 'The marketplace is not configured yet.');
  }
  return errorResponse(503, 'unavailable', 'The marketplace is temporarily unavailable.');
}

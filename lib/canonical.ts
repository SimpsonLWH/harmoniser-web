/**
 * Canonical JSON + content hashes. Server and scripts only (uses node:crypto and Buffer).
 */

import { createHash } from 'node:crypto';

/** Stable stringify: object keys sorted, arrays kept in order, JSON primitives as usual. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      out[key] = sortValue(obj[key]);
    }
    return out;
  }
  return value;
}

/** SHA-256 of the canonical JSON, hex. One document per immutable payload. */
export function contentHash(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}

export function utf8Bytes(text: string): number {
  return Buffer.byteLength(text, 'utf8');
}

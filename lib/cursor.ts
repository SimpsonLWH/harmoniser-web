/** Opaque, validated pagination cursor over the immutable ObjectId order. */

import { Types } from 'mongoose';

const CURSOR_RE = /^[0-9a-f]{24}$/;

export function encodeCursor(id: unknown): string {
  return String(id);
}

export type CursorResult = { ok: true; id: string | null } | { ok: false; message: string };

export function parseCursor(raw: string | null): CursorResult {
  if (raw === null || raw.trim() === '') {
    return { ok: true, id: null };
  }
  const value = raw.trim().toLowerCase();
  if (!CURSOR_RE.test(value) || !Types.ObjectId.isValid(value)) {
    return { ok: false, message: 'cursor is not valid.' };
  }
  return { ok: true, id: value };
}
